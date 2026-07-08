from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from core.views import (
    ProfileViewSet,
    MovieViewSet,
    MovieSessionViewSet,
    BookingViewSet,
    ReviewViewSet,              
    MovieReviewPublicViewSet,
)
from core.auth_views import signup, login_view, logout_view, me

router = DefaultRouter()
router.register(r"profiles", ProfileViewSet, basename="profile")
router.register(r"movies", MovieViewSet)
router.register(r"sessions", MovieSessionViewSet, basename="session")
router.register(r"bookings", BookingViewSet, basename="booking")
router.register(r"reviews", ReviewViewSet, basename="review")
router.register(r"reviews_public", MovieReviewPublicViewSet, basename="review_public")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/signup/", signup),
    path("api/login/", login_view),
    path("api/logout/", logout_view),
    path("api/user/", me),
]
