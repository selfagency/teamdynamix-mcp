---
title: First KB Workflow
---

In this tutorial, you will discover KB categories, create an article, and update it.

## Goal

Successfully complete a minimal Knowledge Base authoring flow.

## Step 1: list categories

Call `teamdynamix_list_kb_categories` with your KB `app_id`.

Choose a valid `CategoryID`.

## Step 2: search existing articles

Call `teamdynamix_search_kb_articles` with a keyword to avoid duplicate content.

## Step 3: create article (write mode)

Ensure `TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true`.

Call `teamdynamix_create_kb_article` with:

- `app_id`
- `article.Title`
- `article.Body`
- `article.CategoryID`

Expected: created article with an ID.

## Step 4: update article

Call `teamdynamix_update_kb_article` with:

- `app_id`
- `article.ArticleID`
- changed fields (for example title/body/publish status)

## Step 5: verify

1. Call `teamdynamix_get_kb_article`.
2. Call `teamdynamix_search_kb_articles` with your title keyword.

Expected: the updated article appears in results.

## Next steps

- Use [How-to: KB Authoring](/how-to/knowledge-base) for task-focused recipes
- Use [Reference: Tool Catalog](/reference/tools) for complete contracts
