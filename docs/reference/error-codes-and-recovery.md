# Error Codes and Recovery

This document provides a list of common error codes, their causes, and recovery steps.

## Common Error Codes

### 400 Bad Request

**Cause**: Invalid input parameters or missing required fields.

**Recovery Steps**:

1. Check the payload schema for the tool you are using.
2. Ensure all required fields are included and correctly formatted.
3. Validate that the data types match the expected schema.

### 401 Unauthorized

**Cause**: Authentication failed or invalid credentials.

**Recovery Steps**:

1. Verify that the authentication mode is correctly set (standard or admin).
2. Ensure the credentials are valid and have not expired.
3. Check if the `TEAMDYNAMIX_ENABLE_WRITE_TOOLS` flag is set if required.

### 403 Forbidden

**Cause**: Insufficient permissions to perform the requested action.

**Recovery Steps**:

1. Verify that the user has the necessary permissions.
2. Check if the `TEAMDYNAMIX_ENABLE_WRITE_TOOLS` flag is set if required.
3. Ensure the user is assigned to the correct role or group.

### 404 Not Found

**Cause**: The requested resource does not exist.

**Recovery Steps**:

1. Verify that the resource ID (e.g., ticket ID, user ID) is correct.
2. Check if the resource exists using a read action (e.g., `get_ticket`).
3. Ensure the resource has not been deleted or archived.

### 429 Too Many Requests

**Cause**: Rate limit exceeded.

**Recovery Steps**:

1. Wait for the rate limit to reset (minimum wait threshold is automatically applied).
2. Implement retry logic with exponential backoff.
3. Optimize your queries to reduce the number of requests.

### 500 Internal Server Error

**Cause**: An unexpected error occurred on the server.

**Recovery Steps**:

1. Check the server logs for more detailed error information.
2. Retry the request after a short delay.
3. Contact support if the issue persists.

## Error Recovery Decision Tree

### Step 1: Identify the Error Code

- Check the error response for the HTTP status code.

### Step 2: Determine the Cause

- Refer to the list of common error codes and their causes.

### Step 3: Apply Recovery Steps

- Follow the recovery steps specific to the error code.

### Step 4: Retry the Request

- After applying the recovery steps, retry the request.

### Step 5: Escalate if Necessary

- If the issue persists, escalate to support or development team.

## Examples

### Example 1: Handling a 404 Not Found Error

**Scenario**: You try to retrieve a ticket that does not exist.

**Error Response**:

```json
{
  "error": "Not Found",
  "message": "Ticket with ID 12345 not found.",
  "statusCode": 404
}
```

**Recovery Steps**:

1. Verify the ticket ID is correct.
2. Use `teamdynamix_tickets` with `action: "search_tickets"` to find the correct ticket ID.
3. Retry the request with the correct ticket ID.

### Example 2: Handling a 429 Too Many Requests Error

**Scenario**: You exceed the rate limit for API requests.

**Error Response**:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "statusCode": 429
}
```

**Recovery Steps**:

1. Wait for the rate limit to reset.
2. Implement retry logic with exponential backoff.
3. Optimize your queries to reduce the number of requests.

### Example 3: Handling a 400 Bad Request Error

**Scenario**: You provide invalid input parameters.

**Error Response**:

```json
{
  "error": "Bad Request",
  "message": "Invalid input parameters.",
  "statusCode": 400
}
```

**Recovery Steps**:

1. Check the payload schema for the tool you are using.
2. Ensure all required fields are included and correctly formatted.
3. Validate that the data types match the expected schema.

## Next Steps

- **Review for Clarity**: Ensure the documentation is clear, concise, and free of jargon.
- **Validate Examples**: Test all examples to ensure they work as intended.
- **Address Feedback**: Incorporate feedback from stakeholders to refine the documentation.
