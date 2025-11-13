import { useLayoutEffect, useRef, useState } from "react";
import { ChatMessage } from "~/components/ChatMessage";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import ollama from "ollama";
import { ThoughtMessage } from "~/components/ThoughtMessage";
import { db } from "~/lib/dexie";
import { useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";

export default function ChatPage() {
  const [messageInput, setMessageInput] = useState("");
  const [streamThought, setStreamThought] = useState("");
  const [streamMessage, setStreamMessage] = useState("");
  const [inThinking, setInThinking] = useState(false);
  const param = useParams();
  const divBottomRef = useRef<HTMLDivElement>(null);

  const handleAutomaticScroll = () => {
    divBottomRef.current?.scrollIntoView()
  }
  
  const messages = useLiveQuery(() => {
    return db.getMessagesForThread(param.threadId as string)
  }, [param.threadId])
  
  useLayoutEffect(() => {
    handleAutomaticScroll()
  }, [streamMessage, streamThought, messages])

  const handleSubmit = async () => {
    await db.createMessage({
      content: messageInput,
      role: "user",
      thought: "",
      thread_id: param.threadId as string,
    });

    let accumulatedThought = "";
    let accumulatedMessage = "";

    const stream = await ollama.chat({
      model: "deepseek-r1:1.5b",
      messages: [
        {
          role: "user",
          content: messageInput.trim(),
        },
      ],
      stream: true,
      think: true,
    });

    for await (const part of stream) {
      const thinking = part.message.thinking;
      const content = part.message.content;

      if (thinking && !inThinking) {
        setInThinking(true);
      }

      if (thinking) {
        accumulatedThought += thinking;
        setStreamThought(accumulatedThought);
      } else if (content) {
        accumulatedMessage += content;
        setStreamMessage(accumulatedMessage);
      }
    }

    await db.createMessage({
      content: accumulatedMessage,
      role: "assistant",
      thought: accumulatedThought,
      thread_id: param.threadId as string,
    });
    
    setInThinking(false);
    setStreamThought("");
    setStreamMessage("");
    setMessageInput("");
  };

  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center px-4 h-16 border-b">
        {/* <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu />
        </Button> */}
        <h1 className="text-xl font-bold ml-4">AI Chat Dashboard</h1>
      </header>
      <main className="flex-1 overflow-auto p-4 w-full">
        <div className="mx-auto space-y-4 pb-20 max-w-screen-md">
          {messages?.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
            />
          ))}

          {!!streamThought && !!inThinking && (
            <ThoughtMessage inThinking={inThinking} thought={streamThought} />
          )}

          {!!streamMessage && (
            <ChatMessage role="assistant" content={streamMessage} />
          )}

          <div ref={divBottomRef}></div>
        </div>
      </main>
      <footer className="border-t p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            className="flex-1"
            placeholder="Type your message here..."
            rows={5}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
          />
          <Button onClick={handleSubmit} type="button">
            Send
          </Button>
        </div>
      </footer>
    </div>
  );
}
