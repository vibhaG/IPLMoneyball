import Chat from '@/components/chat';
import Footer from '@/components/footer';

const ChatPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Chat Room</h1>
          <Chat className="w-full" />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ChatPage; 