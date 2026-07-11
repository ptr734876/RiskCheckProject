# API Endpoints

## Authentication
- `POST /api/auth/login` - Login
  - Request: `{ email: string, password: string }`
  - Response: `{ token: string, user: { id, email, fullName } }`

- `POST /api/auth/register` - Register
  - Request: `{ fullName: string, email: string, password: string }`
  - Response: `{ token: string, user: { id, email, fullName } }`

- `POST /api/auth/logout` - Logout
  - Headers: `Authorization: Bearer <token>`

## Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property by ID
- `GET /api/properties/search?q=query` - Search properties
- `POST /api/properties/click` - Save map click
  - Body: `{ propertyId: number, x: number, y: number }`

## Documents
- `GET /api/documents/required` - Get required documents
- `GET /api/documents/personal` - Get personal documents (auth required)
- `POST /api/documents/checked` - Save checked documents
  - Body: `{ checkedIds: string[] }`
- `GET /api/documents/checked` - Get checked documents

## Algorithms
- `GET /api/algorithms` - Get all algorithms
- `GET /api/algorithms/personal` - Get personal algorithms (auth required)
- `POST /api/algorithms/checked` - Save checked steps
  - Body: `{ algorithmId: string, stepIds: string[] }`
- `GET /api/algorithms/checked` - Get checked steps

## Helpful Articles
- `GET /api/helpful` - Get all articles
- `GET /api/helpful/:id` - Get article by ID

## MFC Locations
- `GET /api/mfc/near-property/:propertyId` - Get MFC near property
- `GET /api/mfc/near-user` - Get MFC near user (auth required)

## Survey
- `GET /api/survey/steps` - Get survey steps
- `POST /api/survey/submit` - Submit survey
  - Body: `{ formData: Record<string, string> }`
- `GET /api/survey/data` - Get saved survey data (auth required)