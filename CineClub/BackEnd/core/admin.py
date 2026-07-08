# core/admin.py
from django.contrib import admin
from .models import Profile, Movie, MovieSession, Booking, Review

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "display_name", "user", "favorite_genre")
    search_fields = ("display_name", "user__username")

@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "year", "duration_minutes", "age_rating")
    search_fields = ("title",)

@admin.register(MovieSession)
class MovieSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "movie", "date_time", "room", "total_seats")
    list_select_related = ("movie",)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "session", "status", "created_at")
    list_select_related = ("user", "session", "session__movie")

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "movie", "rating", "created_at")
    list_select_related = ("user", "movie")
