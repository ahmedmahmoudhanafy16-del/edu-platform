"use client";

import React from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";

interface LiveClassroomProps {
  roomCode: string;
  userName: string;
  isTeacher?: boolean;
  onLeave?: () => void;
}

export default function LiveClassroom({
  roomCode,
  userName,
  isTeacher = false,
  onLeave,
}: LiveClassroomProps) {
  const roomName = `EduPlatform_LiveClass_${roomCode}`;

  return (
    <div className="w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-n-200 shadow-xl bg-slate-900">
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={roomName}
        configOverwrite={{
          startWithAudioMuted: !isTeacher,
          startWithVideoMuted: !isTeacher,
          disableModeratorIndicator: false,
          enableEmailInStats: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          defaultLanguage: "ar",
        }}
        interfaceConfigOverwrite={{
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          MOBILE_APP_PROMO: false,
          DEFAULT_BACKGROUND: "#18180F",
          TOOLBAR_BUTTONS: isTeacher
            ? [
                "microphone",
                "camera",
                "closedcaptions",
                "desktop",
                "fullscreen",
                "fodeviceselection",
                "hangup",
                "chat",
                "raisehand",
                "videoquality",
                "filmstrip",
                "tileview",
                "mute-everyone",
                "security",
              ]
            : [
                "microphone",
                "camera",
                "hangup",
                "chat",
                "raisehand",
                "tileview",
                "fullscreen",
              ],
        }}
        userInfo={{
          displayName: isTeacher ? `أ/ ${userName}` : userName,
          email: "",
        }}
        onReadyToClose={() => {
          if (onLeave) onLeave();
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = "100%";
          iframeRef.style.width = "100%";
          iframeRef.style.border = "none";
        }}
      />
    </div>
  );
}
