import React, { useEffect, useState, useRef } from "react";
import { useAccounts } from "./AccountsProvider";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import ArrowIcon from "./ArrowIcon";

const LinkedinProfileView = () => {
    const { activeAccount, profileActive, setProfileActive, switchNav } = useAccounts();
    const [url, setUrl] = useState('');
    const webviewRef = useRef(null);

    console.log(profileActive);

    const injectCSSScript = `
        (function() {
            const style = document.createElement('style');
            style.textContent = \`
                .scaffold-layout__main {
                    position: absolute !important;
                    inset: 0 !important;
                    bottom: 0 !important;
                    margin: 0 !important;
                    z-index: 9999999999 !important;
                    background: white !important;
                    height: fit-content !important;
                }
                .pv-right-rail__sticky-ad-banner, .global-footer{
                    display: none !important;
                }
                .scaffold-layout__row.scaffold-layout__content {
                    margin: 0 !important;
                    padding: 0 !important;
                }

                #global-nav {
                    display: none !important;
                }
                .authentication-outlet {
                    margin: 0 !important;
                    padding: 0 !important;
                }
                .msg-overlay-list-bubble {
                    display: none !important;
                }
            \`;
            document.head.appendChild(style);
            console.log('CSS injection script executed');
        })();
    `;



    useEffect(() => {
        const handleSheetUrlOpen = (data) => {
            console.log(data);
            const { url, sheet } = data;
            setProfileActive(true);
            setUrl(url);
        };

        window.electron.onSheetUrlOpen(handleSheetUrlOpen);

    }, [setProfileActive]);

    useEffect(() => {
        window.electron.onProfileNotification((data) => {
            const { url, id } = data;
            console.log(data);
            setProfileActive(true);
            setUrl(url);
        });
    }, []);

    useEffect(() => {
        if (webviewRef.current) {
            const webview = webviewRef.current;

            const handleDOMReady = () => {
                webview.executeJavaScript(injectCSSScript)
                    .then(() => console.log('CSS injection script executed successfully'))
                    .catch(err => console.error('Failed to execute CSS injection script:', err));

            };

            webview.addEventListener('dom-ready', handleDOMReady);

            return () => {
                webview.removeEventListener('dom-ready', handleDOMReady);
            };
        }
    }, [url]);

    const handleClose = () => {
        setProfileActive(false);
    };

    return (
        <AnimatePresence>
            {switchNav === 'sheets' && !profileActive && <div onClick={() => setProfileActive(true)}><ArrowIcon /></div>}
            <motion.div
                className="fixed z-50 top-0 right-0 bottom-0 w-[600px] bg-white shadow-lg"
                initial={{ x: "100%" }}
                animate={{ x: profileActive ? 0 : "100%" }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    duration: 0.5
                }}
            >
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
                        aria-label="Close profile view"
                    >
                        <X size={24} />
                    </button>
                </div>

                {
                    url && <webview
                        ref={webviewRef}
                        src={url}
                        partition={activeAccount.partition}
                        className="w-full h-full"
                        data-id={activeAccount.id}
                        preload="../public/preload.js"
                    />
                }

            </motion.div>
        </AnimatePresence>
    );
};

export default LinkedinProfileView;