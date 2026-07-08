from django.db import transaction, IntegrityError
from django.db.models import Avg, Count, Q, F
from django.utils.timezone import now

from rest_framework import permissions, viewsets, decorators, response
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.decorators import action

from .models import Booking, Movie, MovieSession, Profile, Review, ReviewLike
from .serializers import (
    BookingSerializer,
    MovieSerializer,
    MovieDetailSerializer,      
    MovieSessionSerializer,
    ProfileSerializer,
    ReviewSerializer,
    ReviewPublicSerializer,
)


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return getattr(obj, "user_id", None) == request.user.id


class ProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Profile.objects.none()
        return Profile.objects.select_related("user").filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        raise PermissionDenied("Operação não permitida.")

    def destroy(self, request, *args, **kwargs):
        raise PermissionDenied("Operação não permitida.")

    def perform_update(self, serializer):
        if self.get_object().user_id != self.request.user.id:
            raise PermissionDenied("Não podes editar o perfil de outra pessoa.")
        serializer.save()

    @decorators.action(detail=False, methods=["get", "patch"],
                       permission_classes=[permissions.IsAuthenticated])
    def my(self, request):
        prof = request.user.profile
        if request.method.lower() == "patch":
            ser = self.get_serializer(prof, data=request.data, partial=True)
            ser.is_valid(raise_exception=True)
            ser.save()
            return response.Response(ser.data)
        return response.Response(self.get_serializer(prof).data)


class MovieViewSet(viewsets.ModelViewSet):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = (
            super()
            .get_queryset()
            .annotate(
                avg_rating=Avg("reviews__rating"),
                sessions_count=Count("sessions", distinct=True),
            )
        )
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(year__icontains=q))
        return qs.order_by("-year", "title")

    def get_serializer_class(self):
        if getattr(self, "action", None) == "retrieve":
            return MovieDetailSerializer
        return MovieSerializer


class MovieSessionViewSet(viewsets.ModelViewSet):
    serializer_class = MovieSessionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = (
            MovieSession.objects.select_related("movie")
            .annotate(
                seats_taken=Count(
                    "bookings",
                    filter=Q(bookings__status="reserved"),
                    distinct=True,
                )
            )
            .order_by("date_time")
        )
        movie_id = self.request.query_params.get("movie")
        if movie_id:
            qs = qs.filter(movie_id=movie_id)

        
        if self.request.query_params.get("after") == "now":
            qs = qs.filter(date_time__gte=now())

        return qs

    @action(detail=True, methods=["get"], permission_classes=[permissions.AllowAny])
    def seats(self, request, pk=None):
        session = self.get_object()
        rows_letters = [chr(ord("A") + i) for i in range(6)]  
        cols = list(range(1, 11))  

        labels = [f"{r}{c}" for r in rows_letters for c in cols]
        labels = labels[: session.total_seats]  

        reserved = set(
            Booking.objects.filter(session=session, status="reserved")
            .values_list("seat", flat=True)
        )
        return response.Response({
            "rows": len(rows_letters),
            "cols": len(cols),
            "labels": labels,
            "reserved": sorted(list(reserved)),
        })


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return (
            Booking.objects.select_related("session", "session__movie")
            .filter(user=self.request.user)
            .order_by("-created_at")
        )

    @transaction.atomic
    def perform_create(self, serializer):
        session = serializer.validated_data["session"]
        seat = serializer.validated_data.get("seat")

        if not seat:
            raise ValidationError({"detail": "Escolhe um assento."})

        rows_letters = [chr(ord("A") + i) for i in range(6)]  # A..F
        cols = list(range(1, 11))  # 1..10
        map_labels = [f"{r}{c}" for r in rows_letters for c in cols][: session.total_seats]
        if seat not in map_labels:
            raise ValidationError({"detail": "Assento inválido para esta sessão."})

        try:
            serializer.save(user=self.request.user)
        except IntegrityError as e:
            msg = str(e)
            if "uniq_active_booking" in msg:
                raise ValidationError({"detail": "Já tens uma reserva ativa nesta sessão."})
            if "uniq_seat_per_session" in msg:
                raise ValidationError({"detail": f"O assento {seat} já está ocupado."})
            raise

    def perform_update(self, serializer):
        if self.get_object().user_id != self.request.user.id:
            raise PermissionDenied("Não podes alterar a reserva de outra pessoa.")
        serializer.save()

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Review.objects.select_related("movie")
            .filter(user=self.request.user)
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if self.get_object().user_id != self.request.user.id:
            raise PermissionDenied("Não podes editar review de outro utilizador.")
        serializer.save()


class MovieReviewPublicViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReviewPublicSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Review.objects.select_related("movie", "user").order_by("-created_at")
        movie_id = self.request.query_params.get("movie")
        if movie_id:
            qs = qs.filter(movie_id=movie_id)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        review = self.get_object()
        user = request.user

        like_obj, created = ReviewLike.objects.get_or_create(user=user, review=review)
        if created:
            Review.objects.filter(pk=review.pk).update(likes=F("likes") + 1)
            review.refresh_from_db(fields=["likes"])
            return response.Response({"id": review.id, "likes": review.likes, "liked": True})

        like_obj.delete()
        Review.objects.filter(pk=review.pk, likes__gt=0).update(likes=F("likes") - 1)
        review.refresh_from_db(fields=["likes"])
        return response.Response({"id": review.id, "likes": review.likes, "liked": False})
