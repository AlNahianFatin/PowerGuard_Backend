# ⚡ Power Guard – Backend

<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/AlNahianFatin/PowerGuard_Backend?style=for-the-badge)](https://github.com/AlNahianFatin/PowerGuard_Backend/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/AlNahianFatin/PowerGuard_Backend?style=for-the-badge)](https://github.com/AlNahianFatin/PowerGuard_Backend/network)
[![GitHub issues](https://img.shields.io/github/issues/AlNahianFatin/PowerGuard_Backend?style=for-the-badge)](https://github.com/AlNahianFatin/PowerGuard_Backend/issues)
[![GitHub license](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](LICENSE)

**A role-based backend API for managing scheduled load shedding, unexpected power outages, service requests, technician assignments, and power restoration workflows.**

[Frontend Repository](https://github.com/AlNahianFatin/PowerGuard_Frontend) 

</div>

## 📖 Overview

Power Guard is a utility-focused Load Shedding & Power Outage Management System designed to make power interruption management more organized, transparent, and efficient.

This repository contains the backend application that powers the platform. It provides APIs and business logic for customers, technicians, power operators, and administrators. The system supports the management of power distribution information, planned outage schedules, customer-reported service requests, technician assignments, and restoration progress.

The backend is built with **Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL**. It also integrates Redis for caching and temporary data management, Cloudinary for media storage, Nodemailer and EJS for email communication, and bKash for payment processing.

## ✨ Features

- **Role-Based Authentication & Authorization**: Supports CUSTOMER, TECHNICIAN, OPERATOR, and ADMIN roles with protected API access.
- **Multiple Authentication Methods**: Supports credential-based authentication and Google authentication.
- **Secure Account Management**: Password hashing, access and refresh token handling, and email-based verification workflows.
- **Technician Approval Workflow**: Supports technician registration, administrative review, approval or rejection, and account password setup.
- **Power Distribution Management**: Organizes distribution zones, substations, feeders, and service areas.
- **Load-Shedding Schedule Management**: Enables authorized operators and administrators to create and manage planned outage schedules.
- **Outage & Service Request Management**: Allows customers to report unexpected power interruptions and track service requests.
- **Technician Assignment**: Supports assigning technicians to service requests and managing assignment progress.
- **Restoration Tracking**: Maintains service request statuses and repair-related information throughout the resolution workflow.
- **Redis Integration**: Uses Redis for caching and temporary application data, including time-sensitive verification workflows.
- **Email Notifications**: Sends account-related and system notifications using Nodemailer and EJS templates.
- **Cloud-Based File Storage**: Integrates Cloudinary for uploaded files and media.
- **Payment Integration**: Includes bKash payment gateway integration.
- **Scheduled Background Tasks**: Uses node-cron for scheduled backend operations.
- **Data Validation**: Uses Zod to validate incoming data and maintain consistent API payloads.
- **PDF Generation**: Uses PDFKit for generating PDF documents.
- **RESTful API Architecture**: Organizes backend functionality into maintainable API modules.
- **Type-Safe Development**: Uses TypeScript to improve maintainability and reduce runtime errors.

## 🛠️ Tech Stack

### **Backend & Runtime**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

### **Database & ORM**

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

### **Caching & Storage**

![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)

### **Authentication & Validation**

![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)

### **Email & Payment**

![Nodemailer](https://img.shields.io/badge/Nodemailer-0F9D58?style=for-the-badge&logo=nodemailer&logoColor=white)
![bKash](https://img.shields.io/badge/bKash-E2136E?style=for-the-badge&logoColor=white)

### **Development & Deployment**

![Biome](https://img.shields.io/badge/Biome-60A5FA?style=for-the-badge&logo=biome&logoColor=white)
![tsup](https://img.shields.io/badge/tsup-000000?style=for-the-badge&logo=typescript&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

## 🚀 Quick Start

Follow these steps to set up the backend locally.

### Prerequisites

- Node.js (LTS version recommended)
- npm
- Git
- PostgreSQL database
- Redis instance
- Cloudinary account (for media uploads)
- SMTP account or SMTP service (for email functionality)
- bKash sandbox credentials (if testing payment integration)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/AlNahianFatin/PowerGuard_Backend.git
   cd PowerGuard_Backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**

   Create a `.env` file in the project root using `.env.example` as a reference:

   ```bash
   cp .env.example .env
   ```

   Configure the environment variables in `.env`:

   | Variable | Description | Required |
   | :--- | :--- | :---: |
   | `NODE_ENV` | Application environment, such as `development` or `production`. | Yes |
   | `PORT` | Port on which the API server runs. | Yes |
   | `DATABASE_URL` | PostgreSQL connection URL used by Prisma. | Yes |
   | `JWT_ACCESS_SECRET` | Secret used to sign access tokens. | Yes |
   | `JWT_REFRESH_SECRET` | Secret used to sign refresh tokens. | Yes |
   | `JWT_ACCESS_EXPIRES_IN` | Access-token expiration duration. | Yes |
   | `JWT_REFRESH_EXPIRES_IN` | Refresh-token expiration duration. | Yes |
   | `BCRYPT_SALT_ROUNDS` | Number of salt rounds used for password hashing. | Yes |
   | `BACKEND_URL` | Public base URL of the backend API. | Yes |
   | `FRONTEND_URL` | Frontend origin allowed by CORS. | Yes |
   | `GOOGLE_CLIENT_ID` | Google OAuth client ID used for Google authentication. | When using Google auth |
   | `TESTER_ADMIN_NAME` | Name for the tester administrator account. | Optional |
   | `TESTER_ADMIN_EMAIL` | Email for the tester administrator account. | Optional |
   | `TESTER_ADMIN_PASSWORD` | Password for the tester administrator account. | Optional |
   | `TESTER_OPERATOR_NAME` | Name for the tester operator account. | Optional |
   | `TESTER_OPERATOR_EMAIL` | Email for the tester operator account. | Optional |
   | `TESTER_OPERATOR_PASSWORD` | Password for the tester operator account. | Optional |
   | `TESTER_TECHNICIAN_NAME` | Name for the tester technician account. | Optional |
   | `TESTER_TECHNICIAN_EMAIL` | Email for the tester technician account. | Optional |
   | `TESTER_TECHNICIAN_PASSWORD` | Password for the tester technician account. | Optional |
   | `TESTER_CUSTOMER_NAME` | Name for the tester customer account. | Optional |
   | `TESTER_CUSTOMER_EMAIL` | Email for the tester customer account. | Optional |
   | `TESTER_CUSTOMER_PASSWORD` | Password for the tester customer account. | Optional |
   | `REDIS_USER` | Redis username. | Yes |
   | `REDIS_PASSWORD` | Redis password. | Yes |
   | `REDIS_HOST` | Redis host address. | Yes |
   | `REDIS_PORT` | Redis port. | Yes |
   | `SMTP_USER` | SMTP authentication username/email. | Yes |
   | `EMAIL_SENDER` | Sender email address used for outgoing messages. | Yes |
   | `SMTP_PASSWORD` | SMTP authentication password or app password. | Yes |
   | `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name. | For media uploads |
   | `CLOUDINARY_API_KEY` | Cloudinary API key. | For media uploads |
   | `CLOUDINARY_API_SECRET` | Cloudinary API secret. | For media uploads |
   | `BKASH_BASE_URL` | bKash API base URL (sandbox or production). | For bKash |
   | `BKASH_USERNAME` | bKash API username. | For bKash |
   | `BKASH_PASSWORD` | bKash API password. | For bKash |
   | `BKASH_APP_KEY` | bKash application key. | For bKash |
   | `BKASH_APP_SECRET` | bKash application secret. | For bKash |
   | `BKASH_CALLBACK_URL` | Backend callback URL for bKash payment responses. | For bKash |

   Use your own credentials and secrets. Never commit your `.env` file or expose production credentials.

4. **Database setup**

   Make sure your PostgreSQL database is running and `DATABASE_URL` points to it. Generate the Prisma Client:

   ```bash
   npx prisma generate
   ```

   Apply existing migrations to your development database:

   ```bash
   npx prisma migrate dev
   ```

   To create a new migration after changing the Prisma schema:

   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

5. **Start Redis**

   Ensure your Redis service is running and that the connection details in `.env` are correct. Redis is used by backend features that depend on temporary data and caching.

6. **Run the development server**

   ```bash
   npm run dev
   ```

7. **Access the API**

   The API will be available at the configured `PORT`, for example:

   ```text
   http://localhost:5000
   ```

   The actual port depends on your `.env` configuration.

## 📁 Project Structure

The repository is organized around the application source, Prisma database configuration, and project-level tooling.

```text
PowerGuard_Backend/
├── prisma/                         # Prisma schema and database migrations
├── src/                             # Backend application source code
├── .env.example                     # Environment variable template
├── .gitignore                       # Git ignored files
├── Power Guard.postman_collection.json # Postman API collection
├── Project Requirements.md          # Project scope and requirements
├── biome.json                       # Biome formatter and linter configuration
├── package.json                     # Dependencies and npm scripts
├── prisma.config.ts                 # Prisma CLI configuration
├── tsconfig.json                    # TypeScript configuration
├── tsup.config.ts                   # Production build configuration
└── vercel.json                      # Vercel deployment configuration
```

## ⚙️ Configuration

### Environment Variables

Application secrets and service credentials are managed through environment variables. Refer to `.env.example` and the [Installation](#installation) section for the available configuration keys.

### Configuration Files

- **`prisma.config.ts`**: Configures Prisma CLI behavior and database configuration.
- **`tsconfig.json`**: Defines TypeScript compiler options.
- **`tsup.config.ts`**: Configures the TypeScript build process.
- **`biome.json`**: Configures Biome formatting and linting rules.
- **`vercel.json`**: Contains deployment configuration for Vercel.
- **`prisma/`**: Contains the Prisma data model and database migration files.

## 🔧 Development

### Available Scripts

Run these commands from the project root:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server using `tsx watch`. |
| `npm run build` | Builds the application with tsup. |
| `npm start` | Starts the compiled production server from `dist/server.js`. |
| `npm run format:check` | Checks source formatting with Biome. |
| `npm run format:fix` | Formats source files with Biome. |
| `npm run lint:check` | Runs Biome lint checks. |
| `npm run lint:fix` | Applies available Biome lint fixes. |

### Development Workflow

- **Code Formatting**: Use Biome to keep source formatting consistent.
- **Linting**: Run `npm run lint:check` before submitting changes.
- **Database Schema**: Update the Prisma schema and create migrations when changing the data model.
- **Type Safety**: Keep TypeScript types and request validation schemas aligned.
- **API Testing**: Use the included Postman collection to explore and test available API requests.
- **Environment Configuration**: Keep local credentials in `.env`; update `.env.example` when adding new configuration keys.

## 🧪 Testing

A dedicated automated test command is not currently configured in `package.json`. The repository includes a Postman collection that can be imported into Postman for manual API testing.

To run the current checks:

```bash
npm run lint:check
npm run format:check
npm run build
```

## 🚀 Deployment

### Production Build

Build the backend for production:

```bash
npm run build
```

Start the compiled application:

```bash
npm start
```

### Deployment Options

The repository includes a `vercel.json` configuration for Vercel deployment.

Before deploying:

1. Configure all required environment variables in the deployment platform.
2. Provision a reachable PostgreSQL database.
3. Configure a Redis instance accessible by the deployed application.
4. Add valid SMTP, Cloudinary, Google OAuth, and bKash credentials for the features you intend to enable.
5. Set `FRONTEND_URL` to the deployed frontend origin and configure the backend URL and payment callback URL correctly.
6. Apply Prisma migrations to the production database using the deployment workflow appropriate for your environment.

**Note:** Background jobs, persistent Redis connections, and other long-running processes should be checked against the execution limits of your selected hosting platform. Confirm that the deployment environment supports the runtime behavior your application requires.

## 📚 API Reference

The backend exposes REST API endpoints for authentication, user and role management, power distribution information, outage schedules, service requests, technician workflows, and related platform operations.

An API request collection is included in the repository:

**[Power Guard Postman Collection](./Power%20Guard.postman_collection.json)**

Import this JSON file into Postman to inspect and execute the requests. Configure the required base URL, authentication tokens, and request data for your local or deployed environment.

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome!

1. **Fork the repository**.
2. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Implement your changes**, following the existing project conventions.
4. **Run the available checks**:

   ```bash
   npm run lint:check
   npm run format:check
   npm run build
   ```

5. **Commit your changes** with a clear commit message.
6. **Push your branch** to your fork.
7. **Open a Pull Request** to the `main` branch and describe the changes.

### Development Setup for Contributors

Follow the [Quick Start](#quick-start) instructions and configure your own PostgreSQL and Redis instances before working on the project. Do not commit secrets, credentials, generated build output, or local environment files.

## 📄 License

This project is licensed under the **ISC License**, as specified in the repository's `package.json`. If a `LICENSE` file is added, refer to that file for the complete license text.

## 🙏 Acknowledgments

- **Node.js**: For the JavaScript runtime.
- **Express.js**: For the backend web framework.
- **TypeScript**: For a strongly typed development experience.
- **Prisma**: For database modeling and ORM functionality.
- **PostgreSQL**: For reliable relational data storage.
- **Redis**: For caching and temporary data management.
- **Cloudinary**: For cloud-based media storage.
- **Nodemailer**: For email delivery.
- **EJS**: For rendering email templates.
- **Zod**: For request and data validation.
- **bKash**: For payment gateway integration.
- **Biome**: For code formatting and linting.
- **tsup**: For building the TypeScript application.

## 📞 Support & Contact

- **🐛 Issues**: If you encounter a bug or have a feature suggestion, please open an issue in the [GitHub Issues](https://github.com/AlNahianFatin/PowerGuard_Backend/issues) section.
- **📧 Email**: [fatinnahnahian@gmail.com](mailto:fatinnahnahian@gmail.com)
- **GitHub**: [AlNahianFatin](https://github.com/AlNahianFatin)

---

<div align="center">

**⭐ Star this repository if you find it useful!**

Made with ❤️ by [Al Nahian Fatin](https://github.com/AlNahianFatin)

</div>
