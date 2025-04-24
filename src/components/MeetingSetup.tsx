'use client';
import { useEffect, useState } from 'react';
import {
    DeviceSettings,
    VideoPreview,
    useCall,
    useCallStateHooks,
} from '@stream-io/video-react-sdk';

import Alert from './Alert';
import { Button } from './ui/button';

const MeetingSetup = ({
    setIsSetupComplete,
}: {
    setIsSetupComplete: (value: boolean) => void;
}) => {
    // https://getstream.io/video/docs/react/guides/call-and-participant-state/#call-state
    const { useCallEndedAt, useCallStartsAt } = useCallStateHooks();
    const callStartsAt = useCallStartsAt();
    const callEndedAt = useCallEndedAt();
    const callTimeNotArrived =
        callStartsAt && new Date(callStartsAt) > new Date();
    const callHasEnded = !!callEndedAt;

    const call = useCall();

    if (!call) {
        throw new Error(
            'useStreamCall must be used within a StreamCall component.',
        );
    }

    // https://getstream.io/video/docs/react/ui-cookbook/replacing-call-controls/
    const [isMicCamToggled, setIsMicCamToggled] = useState(false);

    useEffect(() => {
        const setupDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const hasCamera = devices.some((d) => d.kind === "videoinput");
                const hasMic = devices.some((d) => d.kind === "audioinput");

                if (!hasCamera || !hasMic) {
                    console.warn("No camera or microphone found.");
                    return;
                }

                if (isMicCamToggled) {
                    await call.camera.disable();
                    await call.microphone.disable();
                } else {
                    await call.camera.enable();
                    await call.microphone.enable();
                }
            } catch (error) {
                console.error("Error enabling devices:", error);
            }
        };

        setupDevices();
    }, [isMicCamToggled, call.camera, call.microphone]);

    const handleJoin = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasCamera = devices.some((d) => d.kind === "videoinput");
            const hasMic = devices.some((d) => d.kind === "audioinput");

            if (!hasCamera && !hasMic) {
                alert("No camera or microphone found. You can still join the call, but your audio/video won't work.");
            }

            // Optional: manually disable them to avoid internal errors
            if (!hasCamera) await call.camera.disable();
            if (!hasMic) await call.microphone.disable();

            await call.join(); // ✅ safely join even if devices are missing

            setIsSetupComplete(true);
        } catch (error) {
            console.error("Failed to join call:", error);
            alert("There was an error joining the call. Please check your permissions.");
        }
    };



    if (callTimeNotArrived)
        return (
            <Alert
                title={`Your Meeting has not started yet. It is scheduled for ${callStartsAt.toLocaleString()}`}
            />
        );

    if (callHasEnded)
        return (
            <Alert
                title="The call has been ended by the host"
                iconUrl="/icons/call-ended.svg"
            />
        );

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-white">
            <h1 className="text-center text-2xl font-bold">Setup</h1>
            <VideoPreview />
            <div className="flex h-16 items-center justify-center gap-3">
                <label className="flex items-center justify-center gap-2 font-medium">
                    <input
                        type="checkbox"
                        checked={isMicCamToggled}
                        onChange={(e) => setIsMicCamToggled(e.target.checked)}
                    />
                    Join with mic and camera off
                </label>
                <DeviceSettings />
            </div>
            <Button
                className="rounded-md bg-green-500 px-4 py-2.5"
                onClick={handleJoin}
            >
                Join meeting
            </Button>
        </div>
    );
};

export default MeetingSetup;