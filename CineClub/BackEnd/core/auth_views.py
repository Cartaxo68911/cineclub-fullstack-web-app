from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie

from rest_framework import permissions
from rest_framework.decorators import (
    api_view, permission_classes, authentication_classes
)
from rest_framework.response import Response

@csrf_exempt
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@authentication_classes([]) 
def signup(request):
    u = request.data.get("username")
    p = request.data.get("password")
    if not u or not p:
        return Response({"detail": "missing credentials"}, status=400)

    if User.objects.filter(username=u).exists():
        return Response({"detail": "username taken"}, status=409)

    user = User.objects.create_user(username=u, password=p)
    login(request, user)
    return Response({
        "id": user.id,
        "username": user.username,
        "session_key": request.session.session_key
    }, status=201)

@csrf_exempt
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@authentication_classes([])  
def login_view(request):
    u = request.data.get("username")
    p = request.data.get("password")
    if not u or not p:
        return Response({"detail": "missing credentials"}, status=400)

    user = authenticate(username=u, password=p)
    if user is None:
        return Response({"detail": "invalid credentials"}, status=401)

    login(request, user)
    resp = Response({
        "detail": "logged in",
        "username": user.username,
        "session_key": request.session.session_key,
    })
    resp["Access-Control-Allow-Credentials"] = "true"
    return resp


@csrf_exempt
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@authentication_classes([]) 
def logout_view(request):
    logout(request)
    return Response({"detail": "logged out"}, status=200)


@ensure_csrf_cookie
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def me(request):
    if not request.user.is_authenticated:
        return Response({"authenticated": False}, status=200)

    return Response({
        "authenticated": True,
        "id": request.user.id,
        "username": request.user.username
    }, status=200)
