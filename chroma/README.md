# Chroma Service (Railway Repo Mode)

Use this directory as a separate Railway service source.

## Railway setup

1. Create a new service in the same Railway project as `backend`.
2. Connect this same GitHub repository.
3. Set the service Root Directory to `chroma`.
4. Railway will detect `chroma/Dockerfile` and deploy `chromadb/chroma:0.5.5`.
5. Add a volume mounted at `/chroma/chroma` for persistence.

## Backend wiring

Set backend service variables:

- `CHROMA_HOST=<your-chroma-service-name>.railway.internal`
- `CHROMA_PORT=8000`

Example with service name `chroma`:

- `CHROMA_HOST=chroma.railway.internal`
