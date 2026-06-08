import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser) {
          loadNotifications(currentUser.email);
        }
      } catch (e) {
        // Not logged in, skip
      }
    };

    fetchUser();

    // Subscribe to notification updates
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create') {
        setNotifications(prev => [event.data, ...prev]);
        setUnreadCount(prev => prev + 1);
      } else if (event.type === 'update' && event.data.read) {
        setNotifications(prev =>
          prev.map(n => n.id === event.data.id ? event.data : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    });

    return () => unsubscribe();
  }, []);

  const loadNotifications = async (email) => {
    try {
      const data = await base44.entities.Notification.filter({
        recipient_email: email,
      }, '-created_at', 20);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await base44.entities.Notification.update(notificationId, {
        read: true,
        read_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await base44.entities.Notification.delete(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'border-l-4 border-[#ff4757]';
      case 'warning':
        return 'border-l-4 border-[#ffa502]';
      default:
        return 'border-l-4 border-[#00d4ff]';
    }
  };

  const getTypeIcon = (type) => {
    if (type.includes('failed') || type.includes('failure') || type.includes('error')) {
      return <AlertCircle className="w-4 h-4 text-[#ff4757]" />;
    }
    return <Check className="w-4 h-4 text-[#2ed573]" />;
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="text-gray-400 hover:text-gray-200 relative h-8 w-8"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff4757] rounded-full animate-pulse" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-[#0d1220] border border-white/10 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="sticky top-0 bg-[#0d1220] border-b border-white/10 p-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-[#ff4757] text-white rounded-full px-2 py-1">
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 hover:bg-white/5 transition-colors ${
                    notif.read ? 'opacity-60' : ''
                  } ${getSeverityColor(notif.severity)}`}
                >
                  <div className="flex items-start gap-2">
                    {getTypeIcon(notif.notification_type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs text-white truncate">
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-1">
                        {new Date(notif.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!notif.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-500 hover:text-[#00d4ff]"
                          onClick={() => markAsRead(notif.id)}
                          title="Mark as read"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-500 hover:text-[#ff4757]"
                        onClick={() => deleteNotification(notif.id)}
                        title="Delete"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}