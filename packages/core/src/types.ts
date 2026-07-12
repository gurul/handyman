// Shared contract between the widget (packages/core), the proxy (server),
// and the Holo3 structured-output schema. This file is the single source of
// truth for the step protocol — server mirrors it, do not fork the shape.

/** Coordinates are integers in [0,1000], normalized to the sent screenshot
 *  (H element-localization contract). The widget scales to viewport px. */
export interface PointCall {
	tool_name: 'point';
	/** Description of the target UI element (H grounding style). */
	element: string;
	x: number;
	y: number;
	/** One spoken/displayed sentence telling the user what to do here. */
	instruction: string;
}

export interface ActClickCall {
	tool_name: 'act_click';
	element: string;
	x: number;
	y: number;
	instruction: string;
}

export interface ActWriteCall {
	tool_name: 'act_write';
	element: string;
	x: number;
	y: number;
	instruction: string;
	/** Text to type into the target. */
	content: string;
	press_enter: boolean;
}

export interface AnswerCall {
	tool_name: 'answer';
	/** Final summary spoken/shown when the tour completes. */
	content: string;
}

export type ToolCall = PointCall | ActClickCall | ActWriteCall | AnswerCall;

/** One turn of the agent loop (H agent-loop structured output shape). */
export interface Step {
	/** Durable memory: task-relevant info from the previous observation. */
	note: string | null;
	thought: string;
	tool_call: ToolCall;
}

/** Widget -> server. One observation per turn. */
export interface StepRequest {
	/** Stable id for this tour session (widget-generated). */
	session_id: string;
	/** The user's question, e.g. "how do I create an invoice?" */
	question: string;
	/** PNG data URI of the current viewport screenshot. */
	screenshot: string;
	viewport: { width: number; height: number };
	/** What happened since the last step (user clicked / agent acted / init). */
	event: 'start' | 'user_acted' | 'agent_acted' | 'skipped';
	url: string;
}

/** Server -> widget. */
export interface StepResponse {
	step: Step;
	/** True when served from fixtures instead of the live model. */
	fixture: boolean;
}

export interface HandymanConfig {
	/** Proxy base, e.g. "http://localhost:3000/api". */
	endpoint: string;
	/** Enable Gradium TTS narration. Default true when voice-token works. */
	tts?: boolean;
	/** Enable Gradium STT (ask by voice). */
	stt?: boolean;
	/** Base z-index for overlay layers. Default 2147483000. */
	zIndex?: number;
	/** Storage key prefix. Default "handyman". */
	storagePrefix?: string;
}
