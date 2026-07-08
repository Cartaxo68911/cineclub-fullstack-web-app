from django.conf import settings
from django.db import models
from django.db.models import Q

User = settings.AUTH_USER_MODEL


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    display_name = models.CharField(max_length=80, unique=True)
    favorite_genre = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    birth_date = models.DateField(blank=True, null=True)
    address = models.CharField(max_length=255, blank=True)
    nationality = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.display_name


class Movie(models.Model):
    title = models.CharField(max_length=150)
    year = models.PositiveIntegerField()
    duration_minutes = models.PositiveIntegerField()
    age_rating = models.CharField(max_length=10, blank=True)

    def __str__(self):
        return f"{self.title} ({self.year})"


class MovieSession(models.Model):
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name="sessions")
    date_time = models.DateTimeField()
    room = models.CharField(max_length=50)
    total_seats = models.PositiveIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["room", "date_time"],
                name="uniq_room_datetime",
            )
        ]

    def __str__(self):
        return f"{self.movie.title} @ {self.date_time}"


class Booking(models.Model):
    STATUS = [
        ("reserved", "Reserved"),
        ("attended", "Attended"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    session = models.ForeignKey(MovieSession, on_delete=models.CASCADE, related_name="bookings")
    status = models.CharField(max_length=10, choices=STATUS, default="reserved")
    created_at = models.DateTimeField(auto_now_add=True)
    seat = models.CharField(max_length=3)  

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "session"],
                condition=Q(status="reserved"),
                name="uniq_active_booking",
            ),
            models.UniqueConstraint(
                fields=["session", "seat"],
                condition=Q(status="reserved"),
                name="uniq_seat_per_session",
            ),
        ]

    def __str__(self):
        return f"{self.user} -> {self.session} [{self.status}] ({self.seat})"


class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    likes = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.movie} - {self.user} ({self.rating})"


class ReviewLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="review_likes")
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="likes_rel")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "review")  
