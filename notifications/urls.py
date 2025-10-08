from django.urls import path
from . import views

urlpatterns = [
    # Notifications
    path('', views.NotificationListView.as_view(), name='notifications'),
    path('<int:pk>/read/', views.mark_notification_as_read, name='mark-notification-read'),
    path('mark-all-read/', views.mark_all_notifications_as_read, name='mark-all-notifications-read'),
    path('unread-count/', views.unread_notifications_count, name='unread-notifications-count'),
    
    # Notification Preferences
    path('preferences/', views.NotificationPreferenceView.as_view(), name='notification-preferences'),
    
    # Chat Messages
    path('chat/conversations/', views.ChatConversationListView.as_view(), name='chat-conversations'),
    path('chat/<int:user_id>/', views.ChatMessageListView.as_view(), name='chat-messages'),
    path('chat/<int:user_id>/send/', views.send_chat_message, name='send-chat-message'),
    path('chat/messages/<int:pk>/read/', views.mark_chat_message_as_read, name='mark-chat-message-read'),
    
    # Templates (Admin only)
    path('email-templates/', views.EmailTemplateListView.as_view(), name='email-templates'),
    path('sms-templates/', views.SMSTemplateListView.as_view(), name='sms-templates'),
    
    # Logs (Admin only)
    path('email-logs/', views.EmailLogListView.as_view(), name='email-logs'),
    path('sms-logs/', views.SMSLogListView.as_view(), name='sms-logs'),
]
