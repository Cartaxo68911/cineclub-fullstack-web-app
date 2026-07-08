# CineClub — Full-Stack Cinema Community Platform

## Overview

CineClub is a full-stack web application developed as an academic project for managing a cinema community platform.

The platform allows users to browse movies, view movie sessions, book seats, manage their profile, publish reviews and interact with reviews through likes.

The project combines a React frontend with a Django REST Framework backend, following a clear separation between user interface, API logic and database rules.

## Project Objective

The main objective of this project was to build a functional web application that supports the core operations of a cinema club platform.

The system allows users to:

- Browse available movies
- View movie details
- Check future movie sessions
- Book seats for specific sessions
- Manage personal bookings
- Create, edit and delete reviews
- Like and unlike public reviews
- Manage their user profile

## Main Features

### Movie Management

- Movie listing
- Movie detail page
- Search by movie title or year
- Average rating calculation
- Number of sessions per movie

### Movie Sessions

- Session listing
- Session details with date, time, room and capacity
- Seat availability map
- Validation of occupied seats

### Bookings

- Seat booking system
- User booking history
- Booking cancellation
- Prevention of duplicate bookings
- Prevention of duplicate seat reservations for the same session

### Reviews

- Public movie reviews
- Rating from 0 to 5 stars
- Review creation, update and deletion
- Like and unlike functionality
- Review like counter

### User Profile

- User profile page
- Personal information management
- Booking history
- Review history

## System Architecture

The application follows a classic frontend and backend architecture:

```text
User → React Frontend → Django REST API → SQLite Database
