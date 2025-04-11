import type { MetaFunction } from "@remix-run/node";
import { useCallback, useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

const URL = "http://localhost:3001";
type User = { id: string; username: string };
type SendeMessage = { room: string; sender: string; message: string };
type Message = { from: string; text: string; timestamp: number };
type JoinRoom = { room: string; sender: User };
export default function Index() {
  const messageEndRef = useRef<HTMLDivElement>(null);
  const socket = useRef<Socket>(null);
  const [isConnected, SetConnected] = useState(false);
  const [room, setRoom] = useState("seo");
  const [messages, setMessage] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("hahah");
  const [recipientId, setrecipientId] = useState("");
  const [allPrivateMessages, setPrivteMessages] = useState([]);
  const [isprivateMessage, setPrivateMessate] = useState("");
  const [isSending, setisSending] = useState(false);
  const [error, setError] = useState("");

  const [currentUser, setUser] = useState<User>({
    id: Math.random().toString(32).substring(2, 12),
    username: `User ${Math.floor(Math.random() * 1000)}`,
  });
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || isSending) return;
    setisSending(true);
    setError(null);
    try {
      socket.current?.emit("message", {
        sender: currentUser.username,
        room,
        message: newMessage,
      });
      setNewMessage("");
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setisSending(false);
    }
  }, [isSending, newMessage, currentUser, room]);

  const ScrollToBottom = useCallback(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );
  const privateMessage = () => {
    socket.current.emit("privateMessage", {
      recipientId,
      message: isprivateMessage,
    });
  };
  useEffect(() => {
    socket.current = io(URL, {
      query: {
        userId: currentUser.id,
      },
    });
    function connect_function() {
      SetConnected(true);
      socket.current?.emit("join", {
        room,
        sender: currentUser.username,
      });
    }
    function disconnect() {
      SetConnected(false);
    }
    const onError = (er: Error) => {
      setError(er);
    };
    function onprivateMessage() {
      socket.current?.on("privateMessage", (data) => {
        console.log(`[Private] ${data.from} says: ${data.text}`);
        setPrivteMessages(data);
      });
    }
    function onMesasge(msg: string) {
      setMessage((prev) => [...prev, msg]);
    }

    socket.current.on("connect", connect_function);
    socket.current.on("connect", onprivateMessage);
    socket.current.on("disconnect", disconnect);
    socket.current.on("error", onError);
    socket.current.on("message", onMesasge);
    return () => {
      socket.current?.off("connect", connect_function);

      socket.current?.off("message", onMesasge);
      socket.current?.off("message", onprivateMessage);
      socket.current?.disconnect();
      socket.current?.off("disconnect", disconnect());
      socket.current?.off("error", onError);
      socket.current?.emit("leave", room);
    };
  }, [room, currentUser]);
  useEffect(() => {
    ScrollToBottom();
  }, [messages, ScrollToBottom]);
  return (
    <div>
      {" "}
      <div className="mx-3 text-lg font-bold flex justify-center items-center min-h-svh">
        <div className="w-full max-w-md">
          <div>
            <h3 className="text-center font-light p-3 text-4xl py-10">
              Chat with Others
            </h3>
            <div className="text-center text-sm mb-4">
              {isConnected ? (
                <span className="text-green-500">
                  Connected as {currentUser.name}
                </span>
              ) : (
                <span className="text-yellow-500">Connecting...</span>
              )}
              {error && <div className="text-red-500 mt-2">{error}</div>}
            </div>
          </div>
          <div className="bg-amber-400 border-black border p-7 rounded-xl">
            {JSON.stringify(allPrivateMessages)}
            <div className="max-h-96 overflow-y-auto mb-4">
              {messages.map((item, index) => (
                <div
                  className="flex spacing-x-3 my-3"
                  key={`${item.from}-${index}-${item.timestamp || Date.now()}`}
                >
                  <div className="text-xs bg-amber-400 text-gray-500 flex justify-center items-center p-4 rounded-xs px-10">
                    {item.from}:
                  </div>
                  <span className="font-light p-3 mx-3">{item.text}</span>
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>
            <div className="my-3">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="w-full font-light p-3 outline-none bg-amber-400 border border-gray-300"
                disabled={!isConnected || isSending}
              />
            </div>
            <div className="my-3">
              <input
                value={isprivateMessage}
                onChange={(e) => setPrivateMessate(e.target.value)}
                placeholder="Type your message..."
                className="w-full font-light p-3 outline-none bg-amber-400 border border-gray-300"
                disabled={!isConnected || isSending}
              />
              <div>
                <input
                  className=""
                  value={recipientId}
                  onChange={(e) => setrecipientId(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                className="bg-black text-white p-3 px-10 border border-black disabled:opacity-50"
                onClick={sendMessage}
                disabled={!newMessage.trim() || !isConnected || isSending}
              >
                {isSending ? "Sending..." : "Send Message"}
              </button>
              <button
                className="bg-gray-300  px-10 mx-3"
                onClick={() => privateMessage()}
              >
                private message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
