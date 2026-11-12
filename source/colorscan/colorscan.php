<?php
/**
 * Plugin Name: ColorSCAN
 * Description: Color Sudoku with a shared, no-hints arcade leaderboard. Use [colorscan] once per page.
 * Version: 0.3.0
 * Author: Kilobytes Development
 * Requires PHP: 7.4
 */
if (!defined('ABSPATH')) { exit; }

final class ColorSCAN {
    const VERSION = '0.3.0';
    static function table() { global $wpdb; return $wpdb->prefix . 'colorscan_runs'; }
    static function activate() {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = self::table(); $collate = $wpdb->get_charset_collate();
        dbDelta("CREATE TABLE $table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            token_hash char(64) NOT NULL,
            level varchar(10) NOT NULL,
            solution varchar(81) NOT NULL,
            started_at bigint(20) unsigned NOT NULL,
            finished_at bigint(20) unsigned DEFAULT NULL,
            hinted tinyint(1) NOT NULL DEFAULT 0,
            initials varchar(3) NOT NULL DEFAULT '',
            seconds bigint(20) unsigned DEFAULT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY token_hash (token_hash),
            KEY ranking (level,hinted,seconds)
        ) $collate;");
        if (!wp_next_scheduled('colorscan_cleanup')) { wp_schedule_event(time(), 'daily', 'colorscan_cleanup'); }
    }
    static function deactivate() { wp_clear_scheduled_hook('colorscan_cleanup'); }
    static function cleanup() {
        global $wpdb; $table = self::table();
        // Keep submitted scores. Remove abandoned/assisted sessions after 7 days.
        $wpdb->query($wpdb->prepare("DELETE FROM $table WHERE initials = '' AND started_at < %d", time() - 7 * DAY_IN_SECONDS));
    }
    static function config() { return array('apiBase' => rest_url('colorscan/v1/'), 'musicAvailable' => is_file(__DIR__ . '/assets/audio/background.mp3'), 'musicUrl' => plugin_dir_url(__FILE__) . 'assets/audio/background.mp3', 'sfxUrl' => plugin_dir_url(__FILE__) . 'assets/audio/marble-place.mp3'); }
    static function head() {
        echo '<script id="colorscan-config">window.ColorSCANConfig=' . wp_json_encode(self::config(), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) . ';</script>';
    }
    static function shortcode() {
        static $rendered = false;
        if ($rendered) { return ''; } $rendered = true;
        $base = plugin_dir_url(__FILE__);
        
        wp_enqueue_script('colorscan', $base . 'assets/game.js', array(), self::VERSION, true);
        wp_add_inline_script('colorscan', 'window.ColorSCANConfig=' . wp_json_encode(self::config()) . ';', 'before');
        return '<style>' . file_get_contents(__DIR__ . '/assets/style.css') . '</style>' . file_get_contents(__DIR__ . '/assets/game.html');
    }
    static function error($code, $message, $status = 400) { return new WP_Error($code, $message, array('status' => $status)); }
    static function response($data) {
        $r = new WP_REST_Response($data, 200);
        $r->header('Cache-Control', 'no-store, private, max-age=0'); return $r;
    }
    static function permission($request) {
        // Scores are public. Anonymous write operations use high-entropy, per-run bearer tokens.
        if ($request->get_method() === 'GET') { return true; }
        $origin = $request->get_header('origin');
        if ($origin && strtolower((string) wp_parse_url($origin, PHP_URL_HOST)) !== strtolower((string) wp_parse_url(home_url(), PHP_URL_HOST))) {
            return self::error('origin', 'Please play on this website to submit scores.', 403);
        }
        if (strlen($request->get_body()) > 4096) { return self::error('size', 'Request is too large.', 413); }
        // Hash the server-provided IP; do not trust forwarded headers. No raw IP is retained.
        $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
        $bucket = 'cs_rl_' . substr(hash_hmac('sha256', $ip . '|' . gmdate('YmdH'), wp_salt('auth')), 0, 40);
        $count = (int) get_transient($bucket);
        if ($count >= 300) { return self::error('rate', 'Too many requests. Please try again later.', 429); }
        set_transient($bucket, $count + 1, HOUR_IN_SECONDS);
        return true;
    }
    static function routes() {
        foreach (array('start', 'hint', 'finish', 'score', 'scores') as $name) {
            register_rest_route('colorscan/v1', '/' . $name, array(
                'methods' => $name === 'scores' ? 'GET' : 'POST',
                'permission_callback' => array(__CLASS__, 'permission'),
                'callback' => array(__CLASS__, $name)
            ));
        }
    }
    static function run($r) {
        global $wpdb; $token = $r->get_param('token');
        if (!is_string($token) || !preg_match('/\A[a-f0-9]{64}\z/D', $token)) { return self::error('token', 'Invalid game session.', 403); }
        $row = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . self::table() . ' WHERE token_hash = %s', hash('sha256', $token)));
        if (!$row || (int) $row->started_at < time() - 7 * DAY_IN_SECONDS) { return self::error('expired', 'This ranked session expired. Start a new puzzle.', 410); }
        return $row;
    }
    static function start($r) {
        global $wpdb; $level = $r->get_param('level');
        if (!in_array($level, array('easy', 'medium', 'hard'), true)) { return self::error('level', 'Choose Easy, Medium, or Hard.'); }
        $bank = json_decode(file_get_contents(__DIR__ . '/puzzles.json'), true);
        if (!isset($bank[$level]) || !$bank[$level]) { return self::error('puzzles', 'Puzzles are unavailable.', 503); }
        $puzzle = $bank[$level][random_int(0, count($bank[$level]) - 1)];
        $digits = range(1, 9); shuffle($digits);
        $map = function($n) use ($digits) { return $n ? $digits[$n - 1] : 0; };
        $givens = array_map($map, $puzzle['givens']); $solution = array_map($map, $puzzle['solution']);
        $token = bin2hex(random_bytes(32)); $now = time();
        $ok = $wpdb->insert(self::table(), array('token_hash' => hash('sha256', $token), 'level' => $level, 'solution' => implode('', $solution), 'started_at' => $now), array('%s','%s','%s','%d'));
        if (!$ok) { return self::error('storage', 'Could not start a ranked game. Please try again.', 503); }
        return self::response(array('level' => $level, 'givens' => $givens, 'token' => $token, 'started_at' => $now));
    }
    static function hint($r) {
        global $wpdb; $run = self::run($r); if (is_wp_error($run)) { return $run; }
        $table = self::table();
        // The flag is monotonic and recorded before the browser reveals a hint.
        $ok = $wpdb->query($wpdb->prepare("UPDATE $table SET hinted = 1 WHERE id = %d AND finished_at IS NULL", $run->id));
        if ($ok === false) { return self::error('storage', 'Could not record hint use. Please retry.', 503); }
        $fresh = $wpdb->get_row($wpdb->prepare("SELECT hinted, finished_at FROM $table WHERE id = %d", $run->id));
        if (!$fresh || $fresh->finished_at !== null) { return self::error('finished', 'This game has already finished.', 409); }
        return self::response(array('eligible' => false));
    }
    static function finish($r) {
        global $wpdb; $run = self::run($r); if (is_wp_error($run)) { return $run; }
        if ((int) $run->hinted) { return self::error('hint_used', 'A hint was used. This puzzle cannot enter the leaderboard.', 403); }
        $board = $r->get_param('board');
        if (!is_array($board) || count($board) !== 81 || array_keys($board) !== range(0, 80)) { return self::error('board', 'Please complete the puzzle first.'); }
        foreach ($board as $n) { if (!is_int($n) || $n < 1 || $n > 9) { return self::error('board', 'Invalid board.'); } }
        if (!hash_equals($run->solution, implode('', $board))) { return self::error('board', 'The puzzle is not solved correctly.'); }
        $now = time(); $seconds = max(0, $now - (int) $run->started_at); $table = self::table();
        $ok = $wpdb->query($wpdb->prepare("UPDATE $table SET finished_at = %d, seconds = %d WHERE id = %d AND hinted = 0 AND finished_at IS NULL", $now, $seconds, $run->id));
        if ($ok === false) { return self::error('storage', 'Could not verify the finish. Please retry.', 503); }
        $fresh = self::run($r); if (is_wp_error($fresh)) { return $fresh; }
        if ((int) $fresh->hinted || $fresh->finished_at === null) { return self::error('hint_used', 'A hint was used. This puzzle cannot enter the leaderboard.', 403); }
        return self::response(array('seconds' => (int) $fresh->seconds));
    }
    static function score($r) {
        global $wpdb; $run = self::run($r); if (is_wp_error($run)) { return $run; }
        if ((int) $run->hinted || $run->finished_at === null) { return self::error('ineligible', 'Only verified wins without hints qualify.', 403); }
        $initials = $r->get_param('initials');
        if (!is_string($initials) || !preg_match('/\A[A-Z]{3}\z/D', $initials)) { return self::error('initials', 'Enter exactly three letters, A–Z.'); }
        $table = self::table();
        // One score per run. Repeating a successful request does not create a duplicate.
        $ok = $wpdb->query($wpdb->prepare("UPDATE $table SET initials = %s WHERE id = %d AND initials = '' AND hinted = 0 AND finished_at IS NOT NULL", $initials, $run->id));
        if ($ok === false) { return self::error('storage', 'Could not save the score. Please retry.', 503); }
        $fresh = self::run($r); if (is_wp_error($fresh)) { return $fresh; }
        return self::response(array('seconds' => (int) $fresh->seconds, 'initials' => $fresh->initials));
    }
    static function scores($r) {
        global $wpdb; $level = $r->get_param('level');
        if (!in_array($level, array('easy','medium','hard'), true)) { return self::error('level', 'Choose a valid difficulty.'); }
        $rows = $wpdb->get_results($wpdb->prepare("SELECT initials, seconds FROM " . self::table() . " WHERE level = %s AND hinted = 0 AND initials <> '' AND finished_at IS NOT NULL ORDER BY seconds ASC, finished_at ASC, id ASC LIMIT 10", $level), ARRAY_A);
        if ($wpdb->last_error) { return self::error('storage', 'Scores are temporarily unavailable.', 503); }
        foreach ($rows as &$row) { $row['seconds'] = (int) $row['seconds']; } unset($row);
        return self::response(array('scores' => $rows));
    }
}
register_activation_hook(__FILE__, array('ColorSCAN', 'activate'));
register_deactivation_hook(__FILE__, array('ColorSCAN', 'deactivate'));
add_action('colorscan_cleanup', array('ColorSCAN', 'cleanup'));
add_action('rest_api_init', array('ColorSCAN', 'routes'));
add_action('wp_head', array('ColorSCAN', 'head'));
add_shortcode('colorscan', array('ColorSCAN', 'shortcode'));
