# 🏡 HouzPro Backend

> **Status**: 🚧 Under Construction

A modern SaaS platform for property management and real estate professionals. Built with performance, scalability, and developer experience in mind.

## 🚀 Tech Stack

- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL + Prisma ORM  
- **Authentication**: JWT + Passport
- **Validation**: Class Validator
- **Testing**: Jest + Supertest
- **Documentation**: Swagger/OpenAPI

## ⚡ Quick Start

```bash
# Clone the repo
git clone <your-repo-url>
cd houzpro-backend

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Configure your database and JWT secrets

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

## 🏗️ Project Structure

```
src/
├── auth/           # Authentication & authorization
├── properties/     # Property management
├── users/          # User management  
├── common/         # Shared utilities
├── database/       # Database config & migrations
└── main.ts         # Application entry point
```

## 📚 API Documentation

Once running, visit `http://localhost:3000/docs` for interactive API documentation.

## 🔧 Available Scripts

```bash
pnpm dev          # Development with hot reload
pnpm build        # Production build
pnpm start        # Start production server
pnpm test         # Run unit tests
pnpm test:e2e     # Run e2e tests
pnpm db:migrate   # Run database migrations
pnpm db:seed      # Seed database with sample data
```

## 🌟 Roadmap

- [x] Project setup & core architecture
- [x] Database schema design
- [ ] User authentication & authorization
- [ ] Property CRUD operations
- [ ] File upload & image management
- [ ] Advanced search & filtering
- [ ] Real-time notifications
- [ ] Analytics dashboard
- [ ] Mobile API optimization

## 🤝 Contributing

This is a personal project currently under active development. Feel free to open issues or suggest improvements.

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ using NestJS, Prisma, and PostgreSQL**
