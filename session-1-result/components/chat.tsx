"use client";

import { CopilotChat, CopilotKit } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

/**
 * `threadId` is handed down from the server-rendered session rather than picked
 * here, so a reload rejoins the same Mastra thread instead of starting a new
 * one. See lib/tutor.ts for why a forged one is useless.
 */
export function Chat({
  agentId,
  threadId,
}: {
  agentId: string;
  threadId: string;
}) {
  return (
    // The Inspector is on by default in development, and its <cpk-web-inspector>
    // host swallows pointer events across the page — including the header's
    // sign-out button.
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      credentials="include"
      enableInspector={false}
    >
      <CopilotChat
        agentId={agentId}
        threadId={threadId}
        className="mx-auto h-full w-full max-w-3xl"
        labels={{
          chatInputPlaceholder: "Add something to the list…",
        }}
      />
    </CopilotKit>
  );
}
