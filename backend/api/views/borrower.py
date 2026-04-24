from rest_framework import viewsets, permissions, filters

from ..models import Borrower
from ..serializers import BorrowerSerializer


class BorrowerViewSet(viewsets.ModelViewSet):
    serializer_class = BorrowerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'phone']
    ordering_fields = ['name']

    def get_queryset(self):
        return Borrower.objects.filter(user=self.request.user).order_by('name')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)