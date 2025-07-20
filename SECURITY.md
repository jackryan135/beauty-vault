# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are
currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please send an email to jackryan135@gmail.com. All security vulnerabilities will be promptly addressed.

Please do not create a public GitHub issue for security vulnerabilities.

## Security Best Practices

When using this application:

1. **Environment Variables**: Never commit sensitive information like API keys or database credentials to version control
2. **Database Security**: Use strong passwords and consider using connection pooling
3. **API Keys**: Keep your Gemini API key secure and rotate it regularly
4. **HTTPS**: Always use HTTPS in production environments
5. **Dependencies**: Regularly update dependencies to patch security vulnerabilities

## Security Features

This application includes several security features:

- Environment variable protection for sensitive data
- SQL injection prevention through parameterized queries
- CORS protection for API endpoints
- Input validation and sanitization
- Secure database connections with connection pooling 