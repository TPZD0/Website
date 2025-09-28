# AI Summarization Setup Guide

This guide explains how to set up the AI-powered PDF summarization feature for the Study Partner application.

## Prerequisites

1. **OpenAI API Account**: You need an OpenAI account with API access
2. **API Key**: Generate an API key from your OpenAI dashboard

## Getting Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the generated API key (it starts with `sk-`)

⚠️ **Important**: Keep your API key secure and never commit it to version control!

## Environment Setup

### For Development (Local)

1. Create a `.env` file in the `fastapi` directory:
```bash
cd fastapi
touch .env
```

2. Add your OpenAI API key to the `.env` file:
```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

3. The FastAPI application will automatically load this environment variable.

### For Docker Deployment

1. Update your `docker-compose.yaml` to include the OpenAI API key:

```yaml
services:
  fastapi:
    build: ./fastapi
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=sk-your-actual-api-key-here
    depends_on:
      - db
```

**Alternative (Recommended)**: Use environment variables from your host system:

```yaml
services:
  fastapi:
    build: ./fastapi
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
```

Then set the environment variable on your host:
```bash
export OPENAI_API_KEY=sk-your-actual-api-key-here
```

## Database Migration

If you have an existing database, run the migration script to add summary columns:

```bash
# Connect to your PostgreSQL database and run:
psql -h localhost -U temp -d advcompro -f migrate_add_summary.sql
```

Or if using Docker:
```bash
docker exec -i study-partner-db-1 psql -U temp -d advcompro < migrate_add_summary.sql
```

## Testing the Setup

1. **Start the services**:
```bash
docker-compose up -d
```

2. **Check the API is running**:
```bash
curl http://localhost:8000/docs
```

3. **Test file upload**:
   - Go to the summarizer page in your frontend
   - Upload a PDF file
   - Click "Generate AI Summary"

## API Endpoints

The following new endpoints are available:

- `POST /api/ai/summarize` - Generate summary for uploaded PDF
- `GET /api/ai/summary/{file_id}` - Retrieve existing summary
- `GET /api/ai/files-with-summaries/{user_id}` - List files with summary status

## Troubleshooting

### Common Issues

1. **"OpenAI API key not found"**
   - Ensure the `OPENAI_API_KEY` environment variable is set
   - Restart the FastAPI service after setting the environment variable

2. **"Failed to extract text from PDF"**
   - Ensure the PDF is not password-protected
   - Check that the PDF contains extractable text (not just images)

3. **"Rate limit exceeded"**
   - You've exceeded OpenAI's rate limits
   - Wait a few minutes before trying again
   - Consider upgrading your OpenAI plan for higher limits

4. **Database errors**
   - Run the migration script if you have an existing database
   - Ensure PostgreSQL is running and accessible

### Logs

Check the FastAPI logs for detailed error messages:
```bash
docker-compose logs fastapi
```

## Cost Considerations

- OpenAI charges per token used
- GPT-3.5-turbo costs approximately $0.002 per 1K tokens
- A typical PDF summary uses 500-1500 tokens
- Monitor your usage in the OpenAI dashboard

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for sensitive data
3. **Rotate API keys** regularly
4. **Monitor API usage** for unexpected charges
5. **Set usage limits** in your OpenAI account

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the FastAPI logs
3. Verify your OpenAI account has sufficient credits
4. Ensure all dependencies are installed correctly
