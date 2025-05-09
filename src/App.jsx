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
  dark: {
    text: {
      primary: '#ffffff',
      secondary: '#a0a0a0',
    },
    background: {
      main: '#1a1a1a',
      secondary: '#2d2d2d',
      border: '#404040',
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
    color: COLORS.text.secondary,
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
    color: COLORS.text.light,
  },
  success: {
    backgroundColor: COLORS.success,
    color: COLORS.text.light,
  },
  danger: {
    backgroundColor: COLORS.danger,
    color: COLORS.text.light,
  },
};

const INPUT_STYLES = {
  base: {
    width: '100%',
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderRadius: '4px',
    border: `1px solid ${COLORS.background.border}`,
    fontSize: '14px',
    '&:focus': {
      outline: 'none',
      borderColor: COLORS.primary,
    },
  },
};

const CONTAINER_STYLES = {
  page: {
    padding: SPACING.xl,
    maxWidth: '1200px',
    margin: '0 auto',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  form: {
    marginBottom: SPACING.lg,
  },
  messageList: {
    border: `1px solid ${COLORS.dark.message.border}`,
    padding: SPACING.md,
    maxHeight: '300px',
    overflowY: 'auto',
    backgroundColor: COLORS.dark.message.background,
    borderRadius: '4px',
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: COLORS.dark.background.main,
    },
    '&::-webkit-scrollbar-thumb': {
      background: COLORS.dark.message.border,
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: COLORS.dark.text.secondary,
    },
  },
  messageItem: {
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: COLORS.dark.message.hover,
    },
  },
};

export default function NATS() {
  const [nats, setNats] = useState();
  const [subject, setSubject] = useState("hello");
  const [messages, setMessages] = useState([]);
  const [publishSubject, setPublishSubject] = useState("hello");
  const [publishMessage, setPublishMessage] = useState("");
  const subscriptionRef = useRef(null);
  const isSubscribedRef = useRef(false);
  const isConnectedRef = useRef(false);

  // create a codec
  const sc = StringCodec();

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
    <div style={CONTAINER_STYLES.page}>
      <div style={CONTAINER_STYLES.section}>
        {isConnectedRef.current ? (
          <>
            <h1 style={TYPOGRAPHY.h1}>Connected to {nats?.getServer()}</h1>
            <button 
              onClick={handleDisconnect}
              style={{ ...BUTTON_STYLES.base, ...BUTTON_STYLES.danger }}
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            <h1 style={TYPOGRAPHY.h1}>Not Connected to NATS</h1>
            <button 
              onClick={handleConnect}
              style={{ ...BUTTON_STYLES.base, ...BUTTON_STYLES.success }}
            >
              Connect to NATS
            </button>
          </>
        )}
      </div>
      
      {isConnectedRef.current && (
        <div style={{ display: 'flex', gap: SPACING.xl }}>
          <div style={{ flex: 1 }}>
            <h2 style={TYPOGRAPHY.h2}>Subscribe</h2>
            <form onSubmit={handleSubscribe} style={CONTAINER_STYLES.form}>
              <label htmlFor="subject" style={TYPOGRAPHY.label}>Subscribe to subject:</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={INPUT_STYLES.base}
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

          <div style={{ flex: 1 }}>
            <h2 style={TYPOGRAPHY.h2}>Publish</h2>
            <form onSubmit={handlePublish} style={CONTAINER_STYLES.form}>
              <label htmlFor="publishSubject" style={TYPOGRAPHY.label}>Subject:</label>
              <input
                type="text"
                id="publishSubject"
                value={publishSubject}
                onChange={(e) => setPublishSubject(e.target.value)}
                style={INPUT_STYLES.base}
              />
              <label htmlFor="publishMessage" style={TYPOGRAPHY.label}>Message:</label>
              <textarea
                id="publishMessage"
                value={publishMessage}
                onChange={(e) => setPublishMessage(e.target.value)}
                style={{ ...INPUT_STYLES.base, minHeight: '100px' }}
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
      )}

      {isConnectedRef.current && (
        <div style={CONTAINER_STYLES.section}>
          <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.dark.text.primary }}>Messages</h2>
          <div style={CONTAINER_STYLES.messageList}>
            {messages.map((msg, index) => (
              <div key={index} style={CONTAINER_STYLES.messageItem}>
                <span style={{ color: COLORS.dark.text.secondary }}>
                  <strong style={{ color: COLORS.dark.text.primary }}>{msg.timestamp}</strong>
                  {' - '}
                  <span style={{ color: COLORS.primary }}>{msg.subject}</span>
                  {': '}
                  <span style={{ color: COLORS.dark.text.primary }}>{msg.message}</span>
                </span>
              </div>
            ))}
            {messages.length === 0 && (
              <div style={{ color: COLORS.dark.text.secondary }}>No messages received yet...</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}