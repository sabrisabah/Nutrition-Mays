from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Max

from .models import (
    Notification, NotificationPreference, EmailTemplate, SMSTemplate,
    EmailLog, SMSLog, ChatMessage
)
from .serializers import (
    NotificationSerializer, NotificationPreferenceSerializer,
    EmailTemplateSerializer, SMSTemplateSerializer, EmailLogSerializer,
    SMSLogSerializer, ChatMessageSerializer, ChatConversationSerializer
)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['notification_type', 'is_read']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_as_read(request, pk):
    try:
        notification = Notification.objects.get(id=pk, recipient=request.user)
        notification.mark_as_read()
        return Response({'message': 'Notification marked as read'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_notifications_as_read(request):
    Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
    return Response({'message': 'All notifications marked as read'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def unread_notifications_count(request):
    count = Notification.objects.filter(recipient=request.user, is_read=False).count()
    return Response({'unread_count': count})


class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        preferences, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return preferences


class ChatConversationListView(generics.ListAPIView):
    serializer_class = ChatConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Get all users who have chatted with the current user
        conversations = ChatMessage.objects.filter(
            Q(sender=user) | Q(recipient=user)
        ).values(
            'sender', 'recipient'
        ).distinct()
        
        conversation_users = set()
        for conv in conversations:
            if conv['sender'] != user.id:
                conversation_users.add(conv['sender'])
            if conv['recipient'] != user.id:
                conversation_users.add(conv['recipient'])
        
        # Get conversation details
        conversation_data = []
        for user_id in conversation_users:
            try:
                from accounts.models import User
                other_user = User.objects.get(id=user_id)
                
                # Get last message
                last_message = ChatMessage.objects.filter(
                    Q(sender=user, recipient=other_user) |
                    Q(sender=other_user, recipient=user)
                ).order_by('-created_at').first()
                
                # Count unread messages
                unread_count = ChatMessage.objects.filter(
                    sender=other_user,
                    recipient=user,
                    is_read=False
                ).count()
                
                conversation_data.append({
                    'user_id': other_user.id,
                    'user_name': other_user.get_full_name(),
                    'user_role': other_user.role,
                    'last_message': last_message.message if last_message else '',
                    'last_message_time': last_message.created_at if last_message else None,
                    'unread_count': unread_count
                })
            except User.DoesNotExist:
                continue
        
        # Sort by last message time
        from django.utils import timezone
        conversation_data.sort(key=lambda x: x['last_message_time'] or timezone.now(), reverse=True)
        
        return conversation_data
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ChatMessageListView(generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['created_at']
    
    def get_queryset(self):
        user = self.request.user
        other_user_id = self.kwargs.get('user_id')
        
        return ChatMessage.objects.filter(
            Q(sender=user, recipient_id=other_user_id) |
            Q(sender_id=other_user_id, recipient=user)
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_chat_message(request, user_id):
    try:
        from accounts.models import User
        recipient = User.objects.get(id=user_id)
        
        message_text = request.data.get('message', '').strip()
        if not message_text:
            return Response({'error': 'Message cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create message
        message = ChatMessage.objects.create(
            sender=request.user,
            recipient=recipient,
            message=message_text,
            appointment_id=request.data.get('appointment_id'),
            meal_plan_id=request.data.get('meal_plan_id')
        )
        
        # TODO: Add real-time notification via WebSocket when channels is properly configured
        
        # Create in-app notification for recipient
        Notification.objects.create(
            recipient=recipient,
            notification_type='new_message',
            title=f'New message from {request.user.get_full_name()}',
            message=message_text[:100] + '...' if len(message_text) > 100 else message_text,
            data={'chat_message_id': message.id}
        )
        
        return Response(ChatMessageSerializer(message).data, status=status.HTTP_201_CREATED)
        
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_chat_message_as_read(request, pk):
    try:
        message = ChatMessage.objects.get(id=pk, recipient=request.user)
        message.mark_as_read()
        return Response({'message': 'Message marked as read'})
    except ChatMessage.DoesNotExist:
        return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)


class EmailTemplateListView(generics.ListCreateAPIView):
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), lambda: self.request.user.role == 'admin']
        return [permissions.IsAuthenticated()]


class SMSTemplateListView(generics.ListCreateAPIView):
    queryset = SMSTemplate.objects.all()
    serializer_class = SMSTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), lambda: self.request.user.role == 'admin']
        return [permissions.IsAuthenticated()]


class EmailLogListView(generics.ListAPIView):
    queryset = EmailLog.objects.all()
    serializer_class = EmailLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'recipient']
    ordering = ['-created_at']
    
    def get_permissions(self):
        return [permissions.IsAuthenticated(), lambda: self.request.user.role in ['admin', 'accountant']]


class SMSLogListView(generics.ListAPIView):
    queryset = SMSLog.objects.all()
    serializer_class = SMSLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'recipient']
    ordering = ['-created_at']
    
    def get_permissions(self):
        return [permissions.IsAuthenticated(), lambda: self.request.user.role in ['admin', 'accountant']]
