# GleamUP Backend

<p align="center">
  Backend API for a service marketplace where customers can hire workers for tasks such as cleaning and other services.
</p>

---

## Overview

This project is a backend system built using **NestJS** for a service marketplace platform.

The platform connects:

* **Customers** → people who want work done
* **Workers** → people who provide services

Customers can post jobs, workers can apply, and payments are handled securely using an **escrow-based payment system**.

---

## Features

* User authentication (JWT)
* Role-based users (Customer / Worker)
* Job posting and hiring
* Worker applications
* Escrow-based payment handling
* Worker wallet system
* Job status tracking
* REST API architecture
* Scalable modular NestJS structure

---

## Tech Stack

* **Backend Framework:** NestJS
* **Language:** TypeScript
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Authentication:** JWT
* **Payments:** Escrow based system (gateway integration planned)
* **API:** REST

---

## System Architecture

High-level workflow:

Customer → Post Job
Worker → Apply for Job
Customer → Hire Worker
Customer → Pay (Escrow)
Worker → Complete Work
Customer → Confirm Completion
Platform → Release Payment to Worker

---

## Project Setup

Install dependencies:

```bash
npm install
```

---

## Running the Application

Development mode:

```bash
npm run start:dev
```

Production mode:

```bash
npm run start:prod
```

---

## Testing

Run unit tests:

```bash
npm run test
```

Run e2e tests:

```bash
npm run test:e2e
```

Check coverage:

```bash
npm run test:cov
```

---

## Project Structure

```
src
 ├── auth
 ├── users
 ├── jobs
 ├── applications
 ├── payments
 ├── wallets
 └── common
```

Each module follows the NestJS modular architecture.

---

## Future Improvements

* Real payment gateway integration
* Real-time chat between customer and worker
* Notifications system
* Worker reviews and ratings
* Admin dashboard

---

## License

This project is licensed under the MIT License.

