from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from .views import *
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()

router.register(r'borrowers', BorrowerViewSet, basename='borrower')
router.register(r'loans', LoanViewSet, basename='loan')
router.register(r'installment', InstallmentViewSet, basename='installment')

urlpatterns = [
    path('', include(router.urls)),

    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/monthly-report/', MonthlyReportView.as_view(), name='dashboard-monthly-report'),
    path('settings/', SystemSettingsView.as_view(), name='settings'),
    
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]