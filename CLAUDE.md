# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PharmaCi is a Flutter application for locating medication availability in pharmacies across Côte d'Ivoire, starting with Abidjan. It serves as a search and localization service, not an e-commerce platform, connecting patients, doctors, and pharmacies while respecting Ivorian health regulations.

The application features a comprehensive healthcare ecosystem including AI health assistance, pharmacy reviews, emergency services, and mobile payments - all implemented in Phase 1.

## Development Commands

### Flutter Commands
- `flutter pub get` - Install dependencies
- `flutter run` - Run the app in development mode
- `flutter build apk` - Build Android APK
- `flutter build ios` - Build iOS app
- `flutter test` - Run tests
- `flutter analyze` - Analyze code for issues
- `flutter clean` - Clean build cache

### Testing and Analysis
- `flutter test --coverage` - Run tests with coverage
- `flutter drive` - Run integration tests
- `flutter analyze --no-fatal-infos` - Analyze without fatal info messages

### Database Configuration
- Database schema defined in `lib/core/database/schema.sql`
- Environment configuration in `lib/core/config/env.dart`
- Supabase backend with PostgreSQL database

## Architecture

### Clean Architecture with Domain-Driven Design

The project follows a strict separation of concerns across three main layers:

#### Domain Layer (`lib/domain/`)
- **Entities**: Core business objects (`PharmacyEntity`, `DrugEntity`, `ReservationEntity`, `StockEntity`, `HealthAssistantEntity`, `ReviewEntity`, `PaymentEntity`)
- **Use Cases**: Business logic organized by feature domain:
  - **Search**: validation, geo-search, filtering
  - **Sync**: data validation, synchronization, real-time updates
  - **Reservation**: creation, tracking, cancellation
  - **Pharmacy**: stock management, statistics, finding pharmacies
  - **Drug**: search, details, interaction checking
  - **Health Assistant**: AI-powered health queries and responses
  - **Reviews**: rating system with pros/cons and verification
  - **Payments**: mobile money and payment processing

#### Data Layer (`lib/data/`)
- **Datasources**: Remote APIs (REST, SMS, USSD, WhatsApp) and local databases
- **Models**: Data transfer objects and API models
- **Repositories**: Implementation of domain data access contracts

#### Presentation Layer (`lib/presentation/`)
- **Providers**: State management using Provider pattern
  - `AuthProvider`: Authentication with password reset and magic links
  - `LocationProvider`: GPS location tracking and permissions
  - `ThemeProvider`: Dark/light theme persistence
  - `PharmacyProvider`, `DrugProvider`, `ReservationProvider`: Feature-specific state
  - `HealthAssistantProvider`: AI conversation management and health queries
  - `ReviewProvider`: Rating system with statistics and helpful votes
  - `PaymentProvider`: Payment processing with multiple methods
- **Widgets**: Reusable UI components organized by feature area
- **Views**: Screens organized by user type and functionality (public, pharmacy, admin)

## Key Technologies and Dependencies

### Core Framework
- **Flutter 3.9.2+** with **Dart**
- **Provider Pattern** for state management
- **Clean Architecture** with Domain-Driven Design

### Maps and Location
- **OpenStreetMap** with `flutter_map` (replaced Google Maps)
- **Geolocator** for GPS location tracking
- **latlong2** for coordinate handling
- **Location** for background location services

### Backend and Database
- **Supabase** for PostgreSQL database and authentication
- **shared_preferences** for local persistence
- **Server-side geolocation filtering** with Haversine distance calculations

### UI and Styling
- **Material 3** design system
- **Google Fonts** for typography
- **Syncfusion Flutter Sliders** for range selection
- **Dotted Border** for custom UI elements
- **Flutter Map** for OpenStreetMap integration
- **Intl** for date formatting and localization

## Database Schema

The application uses a comprehensive PostgreSQL schema with:
- **users**: User profiles with role-based access (patient, pharmacist, admin)
- **pharmacies**: Pharmacy locations with coordinates and operating hours
- **drugs**: Medication information with categories and prescriptions
- **pharmacy_stocks**: Real-time inventory management
- **reservations**: Medication reservation tracking
- **drug_interactions**: Medication interaction warnings
- **sync_logs**: Data synchronization tracking
- **payments**: Payment processing with multiple methods and status tracking
- **reviews**: Rating system with pros/cons and verification
- **health_assistant_conversations**: AI-powered health query history

### Key Database Functions
- `calculate_distance()`: Haversine distance between coordinates
- `find_pharmacies_within_radius()`: Location-based pharmacy search
- `find_pharmacies_with_drug_within_radius()`: Medication availability by location
- `find_pharmacies_by_drug_name_within_radius()`: Drug search by geographic area

## State Management Architecture

### Provider Hierarchy
The app uses `MultiProvider` with these core providers:
```dart
MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (_) => ThemeProvider()),
    ChangeNotifierProvider(create: (_) => AuthProvider()),
    ChangeNotifierProvider(create: (_) => LocationProvider()),
  ],
)
```

### Authentication Flow
- **Email/Password** authentication with Supabase
- **Password reset** functionality with email redirects
- **Magic link** authentication for passwordless access
- **Role-based route protection** using `AuthWrapper`
- **User profile management** with real-time updates

### Location Services
- **Current location tracking** with permission handling
- **Background location** for pharmacy proximity alerts
- **Location-based filtering** with server-side distance calculations
- **Map integration** with custom markers and radius visualization

## Security and Permissions

### Platform Configuration
- **Android**: Location permissions in `AndroidManifest.xml`
- **iOS**: Location usage descriptions in `Info.plist`
- **Network security**: Configuration for OpenStreetMap tile access
- **Row Level Security**: Supabase RLS policies for data protection

### Authentication Security
- **JWT tokens** managed by Supabase
- **Password reset** with secure redirect URLs
- **Route guards** for protected screens
- **Role-based access control** for different user types

## Map Integration

### OpenStreetMap Implementation
- **Custom map widgets** for different use cases:
  - `PharmacyMapWidget`: General pharmacy location display
  - `SearchMapWidget`: Search results with radius visualization
- **Real-time location markers** with status indicators
- **Radius visualization** for search areas
- **Current location tracking** with map centering

### Location Permissions
- **Fine location** for precise pharmacy finding
- **Coarse location** for battery-efficient tracking
- **Background location** for proximity alerts
- **Permission handling** with user-friendly dialogs

## Configuration Setup

### Environment Variables
- **Supabase configuration** in `lib/core/config/env.dart`
- **Database URL** and **anonymous key** for API access
- **Demo pharmacy ID** for development testing

### Theme System
- **Dark/Light theme** persistence with shared preferences
- **System theme** following device preferences
- **Custom color scheme** based on orange accent color
- **Material 3** design adaptation

## Phase 1 Features Implementation

### AI Health Assistant
- **HealthAssistantEntity**: Supports multiple health query types (drug info, symptoms, dosage, interactions)
- **Conversation Management**: History tracking, saved responses, and voice input support
- **Quick Actions**: Pre-defined categories for common health queries
- **Confidence Scoring**: AI response reliability indicators

### Rating and Review System
- **ReviewEntity**: Comprehensive reviews with pros/cons, verification, and helpful votes
- **Rating Statistics**: Real-time calculation of average ratings and distribution
- **Review Moderation**: Reporting system and anonymous posting options
- **Multi-type Reviews**: Support for pharmacy, drug, service, and delivery reviews

### Enhanced Emergency Mode
- **Emergency Timer**: 5-minute countdown with automatic timeout handling
- **Emergency Types**: Categorized emergencies (fever, pain, allergy, injury, poisoning)
- **Real-time Location**: Map integration with pharmacy availability
- **Quick Actions**: Emergency call, location tracking, and navigation

### Mobile Payment and Advanced Reservation
- **PaymentEntity**: Multiple payment methods (Orange Money, MTN, Wave, cards, bank transfer)
- **Payment Processing**: Status tracking, transaction IDs, and receipt generation
- **Advanced Reservations**: Multi-drug selection, time slots, express options
- **Payment Integration**: Seamless payment flow with reservation confirmation

## Important Development Notes

- **OpenStreetMap** is used instead of Google Maps for cost-effectiveness
- **Server-side geolocation filtering** provides efficient distance calculations
- **Role-based authentication** protects sensitive pharmacy management features
- **Real-time synchronization** maintains data consistency across channels
- **Offline-first approach** with local caching and data freshness indicators
- **Multi-channel support** planned for SMS, USSD, and WhatsApp integration
- **AI Health Assistant** provides simulated responses with confidence scoring
- **Mobile Payment** integration supports Ivorian payment methods

## File Structure Conventions

- **Entities** in `lib/domain/entities/` represent core business objects
- **Use cases** in `lib/domain/usecases/` organized by feature domain
- **Providers** in `lib/presentation/providers/` follow feature-specific naming
- **Widgets** in `lib/presentation/widgets/` organized by feature area:
  - `health_assistant/`: AI health assistant components
  - `reviews/`: Rating and review system components
  - `emergency/`: Emergency mode components
  - `payment/`: Payment processing components
  - `reservation/`: Reservation management components
- **Views** in `lib/presentation/views/` organized by user type and functionality:
  - `public/`: General public features
  - `pharmacy/`: Pharmacy management features
  - `admin/`: Administrative features
- **Database schema** defined in `lib/core/database/schema.sql` for reference

## Environment Configuration

The application uses environment variables configured in `lib/core/config/env.dart`:
- **Supabase Configuration**: Database URL and anonymous key
- **Demo Pharmacy ID**: Used for development testing
- **API Endpoints**: External service integrations

## Key Architecture Patterns

### Provider Pattern Implementation
- All providers extend `ChangeNotifier` for state management
- Providers are organized by feature domain with clear separation of concerns
- State changes trigger UI updates through `notifyListeners()`

### Clean Architecture Principles
- **Dependency Rule**: Dependencies point inward, never outward
- **Business Logic Isolation**: Domain layer contains only business rules
- **Data Access Abstraction**: Repositories define contracts, data layer implements them

### Authentication Flow
- **JWT-based authentication** with Supabase
- **Role-based access control** for different user types
- **Route protection** using `AuthWrapper` components
- **Password reset** and **magic link** authentication options