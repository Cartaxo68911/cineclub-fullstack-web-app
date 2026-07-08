from django.utils import timezone
from django.db import models 
from rest_framework import serializers

from .models import Profile, Movie, MovieSession, Booking, Review



class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "id",
            "display_name",
            "favorite_genre",
            "email",
            "phone",
            "birth_date",
            "address",
            "nationality",
            "user",
        ]
        read_only_fields = ["user"]

    def validate_display_name(self, v):
        qs = Profile.objects.filter(display_name__iexact=v)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Esse nome de exibição já existe.")
        return v


class MovieSerializer(serializers.ModelSerializer):
    avg_rating = serializers.FloatField(read_only=True)
    sessions_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Movie
        fields = [
            "id",
            "title",
            "year",
            "duration_minutes",
            "age_rating",
            "avg_rating",
            "sessions_count",
        ]


class MovieSessionSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(source="movie.title", read_only=True)
    seats_taken = serializers.IntegerField(read_only=True)

    class Meta:
        model = MovieSession
        fields = [
            "id",
            "movie",
            "movie_title",
            "date_time",
            "room",
            "total_seats",
            "seats_taken",
        ]

class MovieSessionMiniSerializer(serializers.ModelSerializer):
    seats_taken = serializers.IntegerField(read_only=True)
    movie_title = serializers.CharField(source="movie.title", read_only=True)

    class Meta:
        model = MovieSession
        fields = ["id", "date_time", "room", "total_seats", "seats_taken", "movie_title"]


class MovieDetailSerializer(serializers.ModelSerializer):
    avg_rating = serializers.FloatField(read_only=True)
    sessions_upcoming = serializers.SerializerMethodField()

    class Meta:
        model = Movie
        fields = [
            "id",
            "title",
            "year",
            "duration_minutes",
            "age_rating",
            "avg_rating",
            "sessions_upcoming",
        ]

    def get_sessions_upcoming(self, obj):
        qs = (
            MovieSession.objects
            .filter(movie=obj, date_time__gte=timezone.now())
            .annotate(seats_taken=models.Count("bookings", filter=models.Q(bookings__status="reserved")))
            .order_by("date_time")
        )
        return MovieSessionMiniSerializer(qs, many=True).data


class BookingSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(source="session.movie.title", read_only=True)
    session_date_time = serializers.DateTimeField(source="session.date_time", read_only=True)
    session_room = serializers.CharField(source="session.room", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "user",
            "status",
            "created_at",
            "session",            
            "seat",               
            "movie_title",        
            "session_date_time",  
            "session_room",       
        ]
        read_only_fields = ["user", "created_at", "movie_title", "session_date_time", "session_room"]

    def validate_seat(self, v):
        v = (v or "").upper().strip()
        if len(v) < 2 or len(v) > 3:
            raise serializers.ValidationError("Assento inválido.")
        row = v[0]
        try:
            col = int(v[1:])
        except ValueError:
            raise serializers.ValidationError("Assento inválido.")
        if row < "A" or row > "Z":
            raise serializers.ValidationError("Assento inválido.")
        if not (1 <= col <= 50):
            raise serializers.ValidationError("Assento fora do intervalo.")
        return v


class ReviewSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(source="movie.title", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "user",
            "movie",
            "movie_title",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = ["user", "created_at", "movie_title"]

    def validate_rating(self, v):
        v = int(v)
        if v < 0 or v > 5:
            raise serializers.ValidationError("A classificação deve ser entre 0 e 5.")
        return v


class ReviewPublicSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(source="movie.title", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    likes = serializers.IntegerField(read_only=True)
    liked = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ["id","username","movie","movie_title","rating","comment","created_at","likes","liked"]

    def get_liked(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.likes_rel.filter(user=request.user).exists()
