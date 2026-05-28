export const DEBUG_LOG_ENDPOINT = '/__adg-debug/log';
export const DEFAULT_DEBUG_LOG_DIR = 'logs';
export const DEFAULT_DEBUG_LOG_FILE = 'adg-debug-current.jsonl';
export const MAX_DEBUG_LOG_ENTRY_BYTES = 128 * 1024;
export const MAX_DEBUG_LOG_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_BROWSER_DEBUG_LOG_BYTES = 512 * 1024;
export const MAX_LOG_ARRAY_ITEMS = 40;
export const MAX_LOG_STRING_LENGTH = 2000;
export const CHARGE_BRANCH_TRACE_EVENTS = Object.freeze({
	CLICK: 'charge-branch-click',
	REDUCER_START: 'charge-branch-reducer-start',
	REDUCED: 'charge-branch-reduced',
	RENDER_START: 'charge-branch-render-start',
	RENDERED: 'charge-branch-rendered',
	NEXT_FRAME: 'charge-branch-next-frame',
	HANDOFF_MOUNTED: 'evade-handoff-overlay-mounted',
	HANDOFF_VISIBLE: 'evade-handoff-overlay-visible',
});
export {
	DEFAULT_LOG_FILTERS,
	LOG_AREAS,
	LOG_AREA_VALUES,
	LOG_LEVELS,
	LOG_LEVEL_ORDER,
	cloneLogValue,
	createRuleLogEvent,
	getLogLevelRank,
	normalizeLogArea,
	normalizeLogLevel,
	parseLogAreas,
	parseLogFilters,
	summarizeLogValue,
	shouldLog,
} from './logging-config.js';
