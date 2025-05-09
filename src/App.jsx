import {
  connect,
  StringCodec,
} from "nats.ws";

import {
  useEffect,
  useState,
  useRef,
} from "react";

// Design system constants
const COLORS = {
  primary: '#2196F3',
  success: '#4CAF50',
  danger: '#ff4444',
  light: {
    text: {
      primary: '#333333',
      secondary: '#666666',
      light: '#ffffff',
    },
    background: {
      main: '#ffffff',
      secondary: '#f9f9f9',
      border: '#e0e0e0',
    },
    input: {
      background: '#ffffff',
      border: '#e0e0e0',
      text: '#333333',
    }
  },
  dark: {
    text: {
      primary: '#ffffff',
      secondary: '#a0a0a0',
      light: '#ffffff',
    },
    background: {
      main: '#1a1a1a',
      secondary: '#2d2d2d',
      border: '#404040',
    },
    input: {
      background: '#2d2d2d',
      border: '#404040',
      text: '#ffffff',
    },
    message: {
      background: '#2d2d2d',
      border: '#404040',
      hover: '#363636',
    }
  }
};

const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};

const TYPOGRAPHY = {
  h1: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  h2: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: '14px',
    marginBottom: SPACING.xs,
  },
};

const BUTTON_STYLES = {
  base: {
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'opacity 0.2s',
    '&:hover': {
      opacity: 0.9,
    },
  },
  primary: {
    backgroundColor: COLORS.primary,
    color: COLORS.light.text.light,
  },
  success: {
    backgroundColor: COLORS.success,
    color: COLORS.light.text.light,
  },
  danger: {
    backgroundColor: COLORS.danger,
    color: COLORS.light.text.light,
  },
};

const INPUT_STYLES = {
  base: {
    width: '100%',
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderRadius: '4px',
    fontSize: '14px',
    transition: 'border-color 0.2s',
    '&:focus': {
      outline: 'none',
      borderColor: COLORS.primary,
    },
  },
};

const CONTAINER_STYLES = {
  page: {
    width: '100vw',
    height: '100vh',
    margin: 0,
    transition: 'background-color 0.3s',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: '1400px',
    height: '100%',
    padding: SPACING.md,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    marginBottom: SPACING.lg,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `0 ${SPACING.md}`,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.lg,
    padding: `0 ${SPACING.md}`,
    minHeight: 0,
  },
  forms: {
    display: 'flex',
    gap: SPACING.lg,
    flex: 1,
    minHeight: 0,
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    },
  },
  formSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    '@media (max-width: 768px)': {
      minHeight: 'auto',
    },
  },
  messageSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  messageList: {
    flex: 1,
    padding: SPACING.md,
    overflowY: 'auto',
    borderRadius: '4px',
    minHeight: 0,
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      opacity: 0.8,
    },
  },
  messageItem: {
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
};

export default function NATS() {
  const [nats, setNats] = useState();
  const [subject, setSubject] = useState("hello");
  const [messages, setMessages] = useState([]);
  const [publishSubject, setPublishSubject] = useState("hello");
  const [publishMessage, setPublishMessage] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const subscriptionRef = useRef(null);
  const isSubscribedRef = useRef(false);
  const isConnectedRef = useRef(false);

  const sc = StringCodec();

  const getThemeStyles = () => {
    const theme = isDarkMode ? COLORS.dark : COLORS.light;
    return {
      page: {
        ...CONTAINER_STYLES.page,
        backgroundColor: theme.background.main,
      },
      container: {
        ...CONTAINER_STYLES.container,
        backgroundColor: theme.background.main,
      },
      input: {
        ...INPUT_STYLES.base,
        backgroundColor: theme.input.background,
        border: `1px solid ${theme.input.border}`,
        color: theme.input.text,
        width: '100%',
      },
      messageList: {
        ...CONTAINER_STYLES.messageList,
        backgroundColor: isDarkMode ? COLORS.dark.message.background : theme.background.secondary,
        border: `1px solid ${isDarkMode ? COLORS.dark.message.border : theme.background.border}`,
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: isDarkMode ? COLORS.dark.message.border : theme.background.border,
        },
      },
      messageItem: {
        ...CONTAINER_STYLES.messageItem,
        '&:hover': {
          backgroundColor: isDarkMode ? COLORS.dark.message.hover : theme.background.secondary,
        },
      },
      label: {
        ...TYPOGRAPHY.label,
        color: theme.text.secondary,
      },
      heading: {
        ...TYPOGRAPHY.h1,
        color: theme.text.primary,
      },
      subheading: {
        ...TYPOGRAPHY.h2,
        color: theme.text.primary,
      },
    };
  };

  const styles = getThemeStyles();

  const handleConnect = async () => {
    if (isConnectedRef.current) {
      console.log("Already connected to NATS");
      return;
    }

    try {
      const nc = await connect({
        servers: ["wss://demo.nats.io:8443"],
      });
      setNats(nc);
      isConnectedRef.current = true;
      console.log("Connected to NATS");
    } catch (error) {
      console.error("Error connecting to NATS:", error);
    }
  };

  const handleDisconnect = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    if (nats) {
      nats.drain();
      setNats(null);
      isConnectedRef.current = false;
      console.log("Disconnected from NATS");
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      handleDisconnect();
    };
  }, []);

  // Add resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!isConnectedRef.current) {
      console.log("Not connected to NATS");
      return;
    }

    // Unsubscribe from previous subscription if it exists
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      console.log("unsubscribed from previous subject");
    }

    try {
      const sub = nats.subscribe(subject);
      subscriptionRef.current = sub;
      isSubscribedRef.current = true;
      setMessages([]); // Clear messages when changing subject

      // Start listening for messages
      (async () => {
        try {
          for await (const m of sub) {
            const message = sc.decode(m.data);
            console.log(`[${sub.getProcessed()}]: ${message}`);
            setMessages(prev => [...prev, { subject, message, timestamp: new Date().toLocaleTimeString() }]);
          }
        } catch (error) {
          console.error("Error in subscription loop:", error);
        }
      })();

      console.log(`Subscribed to ${subject}`);
    } catch (error) {
      console.error("Error subscribing:", error);
    }
  }

  const handleUnsubscribe = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
      isSubscribedRef.current = false;
      console.log("Unsubscribed from subject");
    }
  }

  const handlePublish = (e) => {
    e.preventDefault();
    if (!publishMessage.trim() || !isConnectedRef.current) return;
    
    nats.publish(publishSubject, sc.encode(publishMessage));
    setPublishMessage(""); // Clear the message input after publishing
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={CONTAINER_STYLES.header}>
          <div>
            {isConnectedRef.current ? (
              <h1 style={styles.heading}>Connected to {nats?.getServer()}</h1>
            ) : (
              <h1 style={styles.heading}>Not Connected to NATS</h1>
            )}
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              ...BUTTON_STYLES.base,
              backgroundColor: isDarkMode ? COLORS.dark.background.secondary : COLORS.light.background.secondary,
              color: isDarkMode ? COLORS.dark.text.primary : COLORS.light.text.primary,
              border: `1px solid ${isDarkMode ? COLORS.dark.background.border : COLORS.light.background.border}`,
            }}
          >
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {!isConnectedRef.current && (
          <div style={{ padding: `0 ${SPACING.md}` }}>
            <button 
              onClick={handleConnect}
              style={{ ...BUTTON_STYLES.base, ...BUTTON_STYLES.success }}
            >
              Connect to NATS
            </button>
          </div>
        )}
        
        {isConnectedRef.current && (
          <div style={CONTAINER_STYLES.content}>
            <div style={{
              ...CONTAINER_STYLES.forms,
              flexDirection: isMobile ? 'column' : 'row',
            }}>
              <div style={{
                ...CONTAINER_STYLES.formSection,
                minHeight: isMobile ? 'auto' : undefined,
              }}>
                <h2 style={styles.subheading}>Subscribe</h2>
                <form onSubmit={handleSubscribe} style={{
                  ...CONTAINER_STYLES.form,
                  marginBottom: isMobile ? SPACING.lg : 0,
                }}>
                  <label htmlFor="subject" style={styles.label}>Subscribe to subject:</label>
                  <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={styles.input}
                  />
                  <div style={{ display: 'flex', gap: SPACING.sm }}>
                    <button 
                      type="submit" 
                      style={{ ...BUTTON_STYLES.base, ...BUTTON_STYLES.primary }}
                    >
                      {isSubscribedRef.current ? 'Update Subscription' : 'Subscribe'}
                    </button>
                    {isSubscribedRef.current && (
                      <button 
                        type="button" 
                        onClick={handleUnsubscribe}
                        style={{ ...BUTTON_STYLES.base, ...BUTTON_STYLES.danger }}
                      >
                        Unsubscribe
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div style={{
                ...CONTAINER_STYLES.formSection,
                minHeight: isMobile ? 'auto' : undefined,
              }}>
                <h2 style={styles.subheading}>Publish</h2>
                <form onSubmit={handlePublish} style={CONTAINER_STYLES.form}>
                  <label htmlFor="publishSubject" style={styles.label}>Subject:</label>
                  <input
                    type="text"
                    id="publishSubject"
                    value={publishSubject}
                    onChange={(e) => setPublishSubject(e.target.value)}
                    style={styles.input}
                  />
                  <label htmlFor="publishMessage" style={styles.label}>Message:</label>
                  <textarea
                    id="publishMessage"
                    value={publishMessage}
                    onChange={(e) => setPublishMessage(e.target.value)}
                    style={{ ...styles.input, minHeight: '100px' }}
                    placeholder="Enter your message here..."
                  />
                  <button 
                    type="submit" 
                    style={{ ...BUTTON_STYLES.base, ...BUTTON_STYLES.primary }}
                  >
                    Publish Message
                  </button>
                </form>
              </div>
            </div>

            <div style={CONTAINER_STYLES.messageSection}>
              <h2 style={styles.subheading}>Messages</h2>
              <div style={styles.messageList}>
                {messages.map((msg, index) => (
                  <div key={index} style={styles.messageItem}>
                    <span style={{ color: isDarkMode ? COLORS.dark.text.secondary : COLORS.light.text.secondary }}>
                      <strong style={{ color: isDarkMode ? COLORS.dark.text.primary : COLORS.light.text.primary }}>
                        {msg.timestamp}
                      </strong>
                      {' - '}
                      <span style={{ color: COLORS.primary }}>{msg.subject}</span>
                      {': '}
                      <span style={{ color: isDarkMode ? COLORS.dark.text.primary : COLORS.light.text.primary }}>
                        {msg.message}
                      </span>
                    </span>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div style={{ color: isDarkMode ? COLORS.dark.text.secondary : COLORS.light.text.secondary }}>
                    No messages received yet...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}