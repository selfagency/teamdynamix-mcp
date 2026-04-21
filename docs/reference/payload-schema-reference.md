# Payload Schema Reference

This document provides detailed documentation for each tool's payload schema, including required and optional fields, types, and defaults.

## Ticket Search Schema

The `TicketSearchSchema` is used to filter and search for tickets.

### Fields

| Field | Type | Description | Required |
| --- | --- | --- | --- |
| Keywords | string | Full-text search term. | No |
| MaxResults | number | Maximum results to return (1–1000). Default: 50 | No |
| StatusIDs | array of numbers | Filter by ticket status IDs. | No |
| TypeIDs | array of numbers | Filter by ticket type IDs. | No |
| PriorityIDs | array of numbers | Filter by ticket priority IDs. | No |
| UrgencyIDs | array of numbers | Filter by ticket urgency IDs. | No |
| ImpactIDs | array of numbers | Filter by ticket impact IDs. | No |
| AccountIDs | array of numbers | Filter by account/department IDs. | No |
| ResponsibleGroupIDs | array of numbers | Filter by responsible group IDs. | No |
| ResponsibleUids | array of strings | Filter by responsible user GUIDs. | No |
| RequestorUids | array of strings | Filter by requestor user GUIDs. | No |
| CreatedDateFrom | string | ISO 8601 start date for creation date filter. | No |
| CreatedDateTo | string | ISO 8601 end date for creation date filter. | No |
| ModifiedDateFrom | string | ISO 8601 start date for last-modified filter. | No |
| ModifiedDateTo | string | ISO 8601 end date for last-modified filter. | No |
| ClosedDateFrom | string | ISO 8601 start date for closed date filter. | No |
| ClosedDateTo | string | ISO 8601 end date for closed date filter. | No |
| SortBy | string | Field name to sort results by. | No |
| SortOrder | enum | Sort order: A = ascending, D = descending. | No |

### Example

```json
{
  "Keywords": "network issue",
  "MaxResults": 50,
  "StatusIDs": [1, 2],
  "TypeIDs": [10],
  "PriorityIDs": [5],
  "AccountIDs": [100],
  "ResponsibleGroupIDs": [20],
  "ResponsibleUids": ["550e8400-e29b-41d4-a716-446655440000"],
  "RequestorUids": ["550e8400-e29b-41d4-a716-446655440000"],
  "CreatedDateFrom": "2023-01-01T00:00:00Z",
  "CreatedDateTo": "2023-12-31T23:59:59Z",
  "SortBy": "CreatedDate",
  "SortOrder": "D"
}
```

## Ticket Create Schema

The `TicketCreateSchema` is used to create a new ticket.

### Schema Fields

| Field | Type | Description | Required |
| --- | --- | --- | --- |
| TypeID | number | Ticket type ID. | Yes |
| Title | string | Ticket title/subject. | Yes |
| AccountID | number | Account/department ID. | No |
| StatusID | number | Initial ticket status ID. | No |
| PriorityID | number | Ticket priority ID. | No |
| UrgencyID | number | Ticket urgency ID. | No |
| ImpactID | number | Ticket impact ID. | No |
| SourceID | number | Ticket source ID. | No |
| Description | string | Full description/body of the ticket (HTML supported). | No |
| RequestorUID | string | GUID of the requestor. | No |
| ResponsibleUID | string | GUID of the responsible technician. | No |
| ResponsibleGroupID | number | Responsible group ID. | No |
| FormID | number | Ticket form ID. | No |
| Attributes | array of objects | Custom attribute values. | No |

### Schema Example

```json
{
  "TypeID": 10,
  "Title": "Network Outage",
  "AccountID": 100,
  "StatusID": 1,
  "PriorityID": 5,
  "UrgencyID": 3,
  "ImpactID": 2,
  "SourceID": 1,
  "Description": "The network is down in building A.",
  "RequestorUID": "550e8400-e29b-41d4-a716-446655440000",
  "ResponsibleUID": "550e8400-e29b-41d4-a716-446655440000",
  "ResponsibleGroupID": 20,
  "FormID": 1,
  "Attributes": [
    {
      "ID": 1,
      "Value": "Critical"
    }
  ]
}
```

## Ticket Patch Schema

The `TicketPatchSchema` is used to update a ticket.

### Schema Fields

| Field | Type | Description | Required |
| --- | --- | --- | --- |
| TicketID | number | Ticket ID to update. | Yes |
| Attributes | object | Fields to update as key/value pairs. | Yes |
| NotifyRequestor | boolean | Notify the requestor of the change. Default: false | No |
| NotifyResponsible | boolean | Notify the responsible technician of the change. Default: false | No |
| Comments | string | Comment to attach to this update. | No |
| IsPrivate | boolean | Whether the comment is private. Default: false | No |

### Schema Example

```json
{
  "TicketID": 12345,
  "Attributes": {
    "StatusID": 2,
    "Title": "Updated Network Outage"
  },
  "NotifyRequestor": true,
  "NotifyResponsible": true,
  "Comments": "Status updated to In Progress.",
  "IsPrivate": false
}
```

## Ticket Comment Schema

The `TicketCommentSchema` is used to add a comment to a ticket.

### Schema Fields

| Field | Type | Description | Required |
| --- | --- | --- | --- |
| TicketID | number | Ticket ID to comment on. | Yes |
| Body | string | Comment body (HTML supported). | Yes |
| IsPrivate | boolean | Whether this comment is private. Default: false | No |
| NotifyRequestor | boolean | Notify the requestor. Default: false | No |
| NotifyResponsible | boolean | Notify the responsible technician. Default: false | No |

### Schema Example

```json
{
  "TicketID": 12345,
  "Body": "The issue has been resolved.",
  "IsPrivate": false,
  "NotifyRequestor": true,
  "NotifyResponsible": true
}
```

## User Search Schema

The `UserSearchSchema` is used to search for users.

### Schema Fields

| Field | Type | Description | Required |
| --- | --- | --- | --- |
| SearchText | string | Name, username, or email to search for. | No |
| IsActive | boolean | Filter by active (true) or inactive (false) users. | No |
| IsEmployee | boolean | Filter to employees only. | No |
| AppID | number | Scope search to a specific application. | No |
| MaxResults | number | Maximum results (1–1000). Default: 25 | No |

### Schema Example

```json
{
  "SearchText": "John Doe",
  "IsActive": true,
  "IsEmployee": true,
  "AppID": 1,
  "MaxResults": 25
}
```

## Group Search Schema

The `GroupSearchSchema` is used to search for groups.

### Schema Fields

| Field | Type | Description | Required |
| --- | --- | --- | --- |
| NameLike | string | Partial group name to search. | No |
| IsActive | boolean | Filter by active (true) or inactive (false) groups. | No |
| AppID | number | Scope search to a specific application. | No |

### Schema Example

```json
{
  "NameLike": "IT Support",
  "IsActive": true,
  "AppID": 1
}
```

## KB Article Search Schema

The `KbArticleSearchSchema` is used to search for knowledge base articles.

### Schema Fields

| Field | Type | Description | Required |
| --- | --- | --- | --- |
| Keywords | string | Full-text search term. | No |
| MaxResults | number | Maximum results to return (1–1000). Default: 50 | No |
| CategoryIDs | array of numbers | Filter by category IDs. | No |
| StatusIDs | array of numbers | Filter by status IDs. | No |
| AuthorUids | array of strings | Filter by author GUIDs. | No |
| CreatedDateFrom | string | ISO 8601 start date for creation date filter. | No |
| CreatedDateTo | string | ISO 8601 end date for creation date filter. | No |
| ModifiedDateFrom | string | ISO 8601 start date for last-modified filter. | No |
| ModifiedDateTo | string | ISO 8601 end date for last-modified filter. | No |
| SortBy | string | Field name to sort results by. | No |
| SortOrder | enum | Sort order: A = ascending, D = descending. | No |

### Schema Example

```json
{
  "Keywords": "password reset",
  "MaxResults": 50,
  "CategoryIDs": [1, 2],
  "StatusIDs": [1],
  "AuthorUids": ["550e8400-e29b-41d4-a716-446655440000"],
  "CreatedDateFrom": "2023-01-01T00:00:00Z",
  "CreatedDateTo": "2023-12-31T23:59:59Z",
  "SortBy": "CreatedDate",
  "SortOrder": "D"
}
```

## KB Article Create Schema

The `KbArticleCreateSchema` is used to create a new knowledge base article.

### Schema Fields

| Field | Type | Description | Required |
| --- | --- | --- | --- |
| Title | string | Article title. | Yes |
| Body | string | Article body (HTML supported). | Yes |
| CategoryID | number | Category ID. | Yes |
| StatusID | number | Article status ID. | No |
| IsPublished | boolean | Whether the article is published. Default: false | No |
| AuthorUID | string | GUID of the author. | No |
| Attributes | array of objects | Custom attribute values. | No |

### Schema Example

```json
{
  "Title": "How to Reset Your Password",
  "Body": "<p>Follow these steps to reset your password...</p>",
  "CategoryID": 1,
  "StatusID": 1,
  "IsPublished": true,
  "AuthorUID": "550e8400-e29b-41d4-a716-446655440000",
  "Attributes": [
    {
      "ID": 1,
      "Value": "General"
    }
  ]
}
```

## KB Article Update Schema

The `KbArticleUpdateSchema` is used to update a knowledge base article.

### Schema Fields

| Field | Type | Description | Required |
| --- | --- | --- | --- |
| ArticleID | number | Article ID to update. | Yes |
| Attributes | object | Fields to update as key/value pairs. | Yes |
| NotifyAuthor | boolean | Notify the author of the change. Default: false | No |
| Comments | string | Comment to attach to this update. | No |
| IsPrivate | boolean | Whether the comment is private. Default: false | No |

### Schema Example

```json
{
  "ArticleID": 12345,
  "Attributes": {
    "Title": "Updated Password Reset Guide",
    "Body": "<p>Updated steps to reset your password...</p>"
  },
  "NotifyAuthor": true,
  "Comments": "Updated the password reset steps.",
  "IsPrivate": false
}
```

## Next Steps

- **Review for Clarity**: Ensure the documentation is clear, concise, and free of jargon.
- **Validate Examples**: Test all examples to ensure they work as intended.
- **Address Feedback**: Incorporate feedback from stakeholders to refine the documentation.
