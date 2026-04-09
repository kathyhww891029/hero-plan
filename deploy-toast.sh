#!/bin/bash
# 创建 GitHub Gist（匿名）
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Hero-Plan fixed files",
    "public": true,
    "files": {
      "index.html": {"content": ""},
      "app.js": {"content": ""}
    }
  }' \
  https://api.github.com/gists | head -20