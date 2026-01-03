
import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  User, 
  Filter,
  Send,
  Paperclip,
  Search,
  PhoneCall,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Clock
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

// Sample conversation data
const conversations = [
  {
    id: "conv_1",
    name: "Sarah Johnson",
    company: "Acme Corporation",
    avatar: "",
    lastMessage: "Thanks for the update on the integration status!",
    time: "10:24 AM",
    unread: 2,
    online: true
  },
  {
    id: "conv_2",
    name: "Michael Rodriguez",
    company: "TechNova Inc",
    avatar: "",
    lastMessage: "When can we schedule the kickoff meeting?",
    time: "Yesterday",
    unread: 0,
    online: false
  },
  {
    id: "conv_3",
    name: "Emily Chen",
    company: "Global Solutions",
    avatar: "",
    lastMessage: "The contract has been signed and sent back to you.",
    time: "Yesterday",
    unread: 0,
    online: true
  },
  {
    id: "conv_4",
    name: "David Wilson",
    company: "MegaRetail",
    avatar: "",
    lastMessage: "Can we discuss the AI agent configuration?",
    time: "Monday",
    unread: 0,
    online: false
  }
];

// Sample messages for the selected conversation
const messages = [
  {
    id: "msg_1",
    sender: "Sarah Johnson",
    content: "Hi there! I'm wondering if we can get an update on our WhatsApp integration status?",
    time: "10:00 AM",
    isSender: false,
    status: "read"
  },
  {
    id: "msg_2",
    sender: "You",
    content: "Hello Sarah! I checked with our integration team and they've completed the API setup. We're just waiting for verification from WhatsApp Business API team.",
    time: "10:15 AM",
    isSender: true,
    status: "read"
  },
  {
    id: "msg_3",
    sender: "Sarah Johnson",
    content: "That's great news! Any idea on how long the verification might take?",
    time: "10:18 AM",
    isSender: false,
    status: "read"
  },
  {
    id: "msg_4",
    sender: "You",
    content: "Generally it takes 2-3 business days. I'll send you an email as soon as we get the green light. In the meantime, we can prepare the message templates if you'd like?",
    time: "10:22 AM",
    isSender: true,
    status: "read"
  },
  {
    id: "msg_5",
    sender: "Sarah Johnson",
    content: "Thanks for the update on the integration status!",
    time: "10:24 AM",
    isSender: false,
    status: "read"
  }
];

const MessagesPage = () => {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Here you would normally send the message and update the state
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="h-3 w-3" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)]">
        <Card className="glass-card h-full animate-fade-in">
          <div className="grid grid-cols-12 h-full">
            {/* Conversations sidebar */}
            <div className="col-span-12 md:col-span-4 lg:col-span-3 border-r">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Messages</h2>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </div>
                <div className="relative mb-4">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search messages..." 
                    className="pl-8 glass-input w-full" 
                  />
                </div>
                <Tabs defaultValue="all">
                  <TabsList className="glass-card w-full mb-4">
                    <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                    <TabsTrigger value="unread" className="flex-1">Unread</TabsTrigger>
                    <TabsTrigger value="flagged" className="flex-1">Flagged</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <ScrollArea className="h-[calc(100%-132px)]">
                {conversations.map((conversation, index) => (
                  <div 
                    key={conversation.id}
                    className={`
                      p-4 border-b hover:bg-white/10 transition-colors cursor-pointer animate-slide-in
                      ${selectedConversation.id === conversation.id ? 'bg-white/5' : ''}
                    `}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.avatar} alt={conversation.name} />
                          <AvatarFallback className="bg-doo-purple-400 text-white">
                            {conversation.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.online && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                        )}
                      </div>
                      <div className="ml-3 flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium">{conversation.name}</h3>
                          <p className="text-xs text-muted-foreground">{conversation.time}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{conversation.company}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs truncate max-w-[80%]">{conversation.lastMessage}</p>
                          {conversation.unread > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-doo-purple-500 text-white text-xs">
                              {conversation.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
            
            {/* Conversation area */}
            <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col h-full">
              {selectedConversation ? (
                <>
                  {/* Conversation header */}
                  <div className="p-4 border-b glass-card flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} />
                        <AvatarFallback className="bg-doo-purple-400 text-white">
                          {selectedConversation.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium">{selectedConversation.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {selectedConversation.company} • {selectedConversation.online ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <PhoneCall className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <Video className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <Search className="h-5 w-5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-card">
                          <DropdownMenuItem>View Contact</DropdownMenuItem>
                          <DropdownMenuItem>View Customer</DropdownMenuItem>
                          <DropdownMenuItem>Share Conversation</DropdownMenuItem>
                          <Separator />
                          <DropdownMenuItem className="text-destructive">Delete Conversation</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Messages area */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div 
                          key={message.id}
                          className={`flex ${message.isSender ? 'justify-end' : 'justify-start'} animate-slide-in`}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className={`max-w-[70%] ${message.isSender ? 'order-2' : 'order-1'}`}>
                            {!message.isSender && (
                              <div className="flex items-center mb-1">
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarFallback className="bg-doo-purple-400 text-white text-xs">
                                    {message.sender.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium">{message.sender}</span>
                              </div>
                            )}
                            <div 
                              className={`p-3 rounded-lg ${
                                message.isSender 
                                  ? 'bg-doo-purple-500 text-white' 
                                  : 'glass-card'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <div className={`flex items-center mt-1 ${message.isSender ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-xs text-muted-foreground">{message.time}</span>
                              {message.isSender && (
                                <span className="ml-1 text-muted-foreground">
                                  {getStatusIcon(message.status)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {/* Message input */}
                  <div className="p-4 border-t glass-card">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <Input 
                        placeholder="Type a message..." 
                        className="glass-input flex-1"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button 
                        className="glass-button rounded-full h-10 w-10 p-0 flex items-center justify-center"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MessagesPage;
