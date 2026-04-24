from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from ..models import SystemSettings
from ..serializers import SystemSettingsSerializer

class SystemSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        settings, _ = SystemSettings.objects.get_or_create(user=request.user)
        serializer = SystemSettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        settings, _ = SystemSettings.objects.get_or_create(user=request.user)
        serializer = SystemSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
