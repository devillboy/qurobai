# 🔥 Nova AI - Complete Free Stack Architecture

## A) System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NOVA AI PLATFORM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        CLIENT LAYER (React)                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │ Chat UI     │  │ 3D Effects  │  │ State Mgmt  │  │ SSE Client │  │   │
│  │  │ (React)     │  │ (Three.js)  │  │ (Zustand)   │  │ (Streaming)│  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     API GATEWAY (FastAPI/Go)                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │ REST API    │  │ WebSocket   │  │ Rate Limit  │  │ Auth/RBAC  │  │   │
│  │  │ Endpoints   │  │ Handler     │  │ (In-Memory) │  │ (JWT)      │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐            │
│         ▼                          ▼                          ▼            │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────────┐    │
│  │ MODEL       │          │ VECTOR DB   │          │ CACHE LAYER     │    │
│  │ SERVING     │          │ (Qdrant)    │          │ (Redis/Dragonfly)│   │
│  │             │          │             │          │                  │    │
│  │ ┌─────────┐ │          │ ┌─────────┐ │          │ ┌──────────────┐ │    │
│  │ │ vLLM/   │ │          │ │ RAG     │ │          │ │ Session      │ │    │
│  │ │ TGI     │ │◄────────►│ │ Pipeline│ │◄────────►│ │ Memory       │ │    │
│  │ └─────────┘ │          │ └─────────┘ │          │ └──────────────┘ │    │
│  │             │          │             │          │                  │    │
│  │ ┌─────────┐ │          │ ┌─────────┐ │          │ ┌──────────────┐ │    │
│  │ │ Ollama  │ │          │ │ Hybrid  │ │          │ │ KV Cache     │ │    │
│  │ │ (Local) │ │          │ │ Search  │ │          │ │ (LLM)        │ │    │
│  │ └─────────┘ │          │ └─────────┘ │          │ └──────────────┘ │    │
│  └─────────────┘          └─────────────┘          └─────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DATA & STORAGE LAYER                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │ PostgreSQL  │  │ Object      │  │ Training    │  │ Logs       │  │   │
│  │  │ (Users/Meta)│  │ Storage     │  │ Datasets    │  │ (Loki)     │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                              INFRASTRUCTURE
┌─────────────────────────────────────────────────────────────────────────────┐
│  Docker Compose / K3s │ GitHub Actions │ Grafana + Prometheus │ Traefik    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## B) Complete Free Tech Stack

### Frontend
| Component | Technology | License |
|-----------|------------|---------|
| Framework | React 18 + Vite | MIT |
| Styling | Tailwind CSS | MIT |
| Animations | Framer Motion | MIT |
| 3D Effects | Three.js (optional) | MIT |
| State | Zustand / React Query | MIT |
| Icons | Lucide React | ISC |

### Backend
| Component | Technology | License |
|-----------|------------|---------|
| API Server | FastAPI (Python) / Go Fiber | MIT/BSD |
| WebSocket | FastAPI WebSocket / Gorilla | MIT |
| Auth | JWT + bcrypt | MIT |
| Rate Limiting | SlowAPI / In-memory | MIT |

### AI/ML Stack
| Component | Technology | License |
|-----------|------------|---------|
| Model Serving | vLLM / TGI / Ollama | Apache 2.0 |
| Models | Llama 3.1, Mistral, Qwen | Various Open |
| Embeddings | BGE / E5 / Nomic | Apache 2.0 |
| Reranking | BGE Reranker | Apache 2.0 |
| Fine-tuning | QLoRA + PEFT | Apache 2.0 |

### Data Layer
| Component | Technology | License |
|-----------|------------|---------|
| Vector DB | Qdrant / Milvus | Apache 2.0 |
| SQL DB | PostgreSQL | PostgreSQL |
| Cache | Redis / Dragonfly | BSD/BSL |
| Object Storage | MinIO | AGPL/Apache |

### Infrastructure
| Component | Technology | License |
|-----------|------------|---------|
| Containers | Docker + Compose | Apache 2.0 |
| Orchestration | K3s / MicroK8s | Apache 2.0 |
| CI/CD | GitHub Actions | Free tier |
| Proxy | Traefik / Caddy | MIT/Apache |
| Monitoring | Grafana + Prometheus | Apache 2.0 |
| Logging | Loki + Promtail | AGPL |

---

## C) Recommended Folder Structure

```
nova-ai/
├── frontend/                    # React Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/           # Chat UI components
│   │   │   ├── ui/             # Shadcn components
│   │   │   └── effects/        # 3D/animation components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utilities
│   │   ├── stores/             # Zustand stores
│   │   ├── services/           # API clients
│   │   └── pages/              # Route pages
│   ├── public/
│   └── package.json
│
├── backend/                     # FastAPI Backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── chat.py     # Chat endpoints
│   │   │   │   ├── auth.py     # Auth endpoints
│   │   │   │   └── models.py   # Model management
│   │   │   └── deps.py         # Dependencies
│   │   ├── core/
│   │   │   ├── config.py       # Settings
│   │   │   ├── security.py     # JWT/Auth
│   │   │   └── rate_limit.py   # Rate limiting
│   │   ├── models/             # Pydantic models
│   │   ├── services/
│   │   │   ├── llm.py          # LLM client
│   │   │   ├── rag.py          # RAG pipeline
│   │   │   └── memory.py       # Conversation memory
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
│
├── model-serving/              # vLLM/TGI configs
│   ├── configs/
│   │   ├── vllm.yaml
│   │   └── tgi.yaml
│   └── scripts/
│       ├── download_model.sh
│       └── quantize.py
│
├── vector-db/                  # Qdrant setup
│   ├── config/
│   └── init-scripts/
│
├── data-pipeline/              # ETL & Training
│   ├── scrapers/
│   ├── processors/
│   ├── training/
│   │   ├── qlora_config.yaml
│   │   └── train.py
│   └── datasets/
│
├── infra/                      # Infrastructure
│   ├── docker/
│   │   ├── Dockerfile.frontend
│   │   ├── Dockerfile.backend
│   │   └── docker-compose.yml
│   ├── k8s/
│   │   ├── deployments/
│   │   ├── services/
│   │   └── ingress/
│   └── terraform/              # Optional IaC
│
├── monitoring/                 # Observability
│   ├── grafana/
│   │   └── dashboards/
│   ├── prometheus/
│   │   └── prometheus.yml
│   └── loki/
│
└── docs/
    ├── ARCHITECTURE.md
    ├── DEPLOYMENT.md
    └── API.md
```

---

## D) Backend API Specifications

### Core Endpoints

```python
# backend/app/api/routes/chat.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import asyncio

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

class Message(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: str = "llama-3.1-8b"
    temperature: float = 0.7
    max_tokens: int = 2048
    stream: bool = True

class ChatResponse(BaseModel):
    id: str
    model: str
    message: Message
    usage: dict

# Streaming chat endpoint
@router.post("/completions")
async def chat_completions(
    request: ChatRequest,
    llm_service: LLMService = Depends(get_llm_service)
):
    if request.stream:
        return StreamingResponse(
            llm_service.stream_generate(
                messages=request.messages,
                model=request.model,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            ),
            media_type="text/event-stream"
        )
    else:
        response = await llm_service.generate(
            messages=request.messages,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        return ChatResponse(**response)

# RAG-enhanced chat
@router.post("/rag")
async def rag_chat(
    request: ChatRequest,
    llm_service: LLMService = Depends(get_llm_service),
    rag_service: RAGService = Depends(get_rag_service)
):
    # Retrieve relevant context
    context = await rag_service.retrieve(
        query=request.messages[-1].content,
        top_k=5
    )
    
    # Augment messages with context
    augmented_messages = rag_service.augment_messages(
        messages=request.messages,
        context=context
    )
    
    return StreamingResponse(
        llm_service.stream_generate(
            messages=augmented_messages,
            model=request.model
        ),
        media_type="text/event-stream"
    )
```

### LLM Service (vLLM Client)

```python
# backend/app/services/llm.py

import httpx
from typing import AsyncIterator, List
import json

class LLMService:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=120.0)
    
    async def stream_generate(
        self,
        messages: List[dict],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> AsyncIterator[str]:
        """Stream tokens from vLLM/TGI server."""
        
        payload = {
            "model": model,
            "messages": [m.dict() for m in messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }
        
        async with self.client.stream(
            "POST",
            f"{self.base_url}/v1/chat/completions",
            json=payload
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        yield "data: [DONE]\n\n"
                        break
                    try:
                        chunk = json.loads(data)
                        content = chunk["choices"][0]["delta"].get("content", "")
                        if content:
                            yield f"data: {json.dumps({'content': content})}\n\n"
                    except json.JSONDecodeError:
                        continue
    
    async def generate(
        self,
        messages: List[dict],
        model: str,
        **kwargs
    ) -> dict:
        """Non-streaming generation."""
        
        response = await self.client.post(
            f"{self.base_url}/v1/chat/completions",
            json={
                "model": model,
                "messages": [m.dict() for m in messages],
                **kwargs,
                "stream": False
            }
        )
        return response.json()
```

### RAG Pipeline

```python
# backend/app/services/rag.py

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import numpy as np
from sentence_transformers import SentenceTransformer

class RAGService:
    def __init__(
        self,
        qdrant_url: str = "http://localhost:6333",
        collection_name: str = "documents",
        embed_model: str = "BAAI/bge-base-en-v1.5"
    ):
        self.client = QdrantClient(url=qdrant_url)
        self.collection_name = collection_name
        self.encoder = SentenceTransformer(embed_model)
        self._ensure_collection()
    
    def _ensure_collection(self):
        """Create collection if not exists."""
        collections = self.client.get_collections().collections
        if not any(c.name == self.collection_name for c in collections):
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=768,  # BGE-base dimension
                    distance=Distance.COSINE
                )
            )
    
    async def retrieve(
        self,
        query: str,
        top_k: int = 5,
        score_threshold: float = 0.7
    ) -> List[dict]:
        """Retrieve relevant documents."""
        
        # Encode query
        query_vector = self.encoder.encode(query).tolist()
        
        # Search
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            limit=top_k,
            score_threshold=score_threshold
        )
        
        return [
            {
                "content": hit.payload.get("content", ""),
                "metadata": hit.payload.get("metadata", {}),
                "score": hit.score
            }
            for hit in results
        ]
    
    def augment_messages(
        self,
        messages: List[dict],
        context: List[dict]
    ) -> List[dict]:
        """Inject retrieved context into messages."""
        
        context_text = "\n\n".join([
            f"[Source {i+1}]: {doc['content']}"
            for i, doc in enumerate(context)
        ])
        
        system_prompt = f"""You are Nova AI, a helpful assistant. 
Use the following context to answer questions accurately:

{context_text}

If the context doesn't contain relevant information, say so."""
        
        return [
            {"role": "system", "content": system_prompt},
            *messages
        ]
```

---

## E) Model Serving Configurations

### vLLM Configuration

```yaml
# model-serving/configs/vllm.yaml
model: meta-llama/Llama-3.1-8B-Instruct
tensor_parallel_size: 1
gpu_memory_utilization: 0.9
max_model_len: 8192
quantization: awq  # or gptq, none
dtype: auto
trust_remote_code: true

# Optimization flags
enable_prefix_caching: true
use_v2_block_manager: true
enable_chunked_prefill: true

# Server settings
host: 0.0.0.0
port: 8000
```

### vLLM Launch Script

```bash
#!/bin/bash
# model-serving/scripts/start_vllm.sh

python -m vllm.entrypoints.openai.api_server \
    --model meta-llama/Llama-3.1-8B-Instruct \
    --tensor-parallel-size 1 \
    --gpu-memory-utilization 0.9 \
    --max-model-len 8192 \
    --quantization awq \
    --enable-prefix-caching \
    --host 0.0.0.0 \
    --port 8000
```

### Ollama (Local Development)

```bash
# Pull model
ollama pull llama3.1:8b

# Run with custom parameters
ollama run llama3.1:8b \
    --num-ctx 8192 \
    --num-gpu 1
```

---

## F) Docker Compose (Complete Stack)

```yaml
# infra/docker/docker-compose.yml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ../../frontend
      dockerfile: ../infra/docker/Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://backend:8080
    depends_on:
      - backend

  # Backend API
  backend:
    build:
      context: ../../backend
      dockerfile: ../infra/docker/Dockerfile.backend
    ports:
      - "8080:8080"
    environment:
      - LLM_BASE_URL=http://vllm:8000
      - QDRANT_URL=http://qdrant:6333
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://nova:nova@postgres:5432/nova
    depends_on:
      - vllm
      - qdrant
      - redis
      - postgres

  # vLLM Model Server
  vllm:
    image: vllm/vllm-openai:latest
    ports:
      - "8000:8000"
    volumes:
      - model-cache:/root/.cache/huggingface
    environment:
      - HUGGING_FACE_HUB_TOKEN=${HF_TOKEN}
    command: >
      --model meta-llama/Llama-3.1-8B-Instruct
      --tensor-parallel-size 1
      --gpu-memory-utilization 0.9
      --max-model-len 8192
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  # Vector Database
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant-data:/qdrant/storage

  # Cache
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=nova
      - POSTGRES_PASSWORD=nova
      - POSTGRES_DB=nova
    volumes:
      - postgres-data:/var/lib/postgresql/data

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ../../monitoring/prometheus:/etc/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ../../monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards

volumes:
  model-cache:
  qdrant-data:
  redis-data:
  postgres-data:
  grafana-data:
```

---

## G) Deployment Instructions

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/your-org/nova-ai.git
cd nova-ai

# 2. Start infrastructure
docker-compose -f infra/docker/docker-compose.yml up -d

# 3. Frontend development
cd frontend
npm install
npm run dev

# 4. Backend development
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

### Production (K3s)

```bash
# 1. Install K3s
curl -sfL https://get.k3s.io | sh -

# 2. Apply Kubernetes manifests
kubectl apply -f infra/k8s/namespaces/
kubectl apply -f infra/k8s/secrets/
kubectl apply -f infra/k8s/deployments/
kubectl apply -f infra/k8s/services/
kubectl apply -f infra/k8s/ingress/

# 3. Verify
kubectl get pods -n nova-ai
```

---

## H) Optimization Strategies

### Model Optimization
- **Quantization**: AWQ/GPTQ for 4-bit inference (2-4x memory reduction)
- **KV Cache**: Enable prefix caching for repeated prompts
- **Batching**: Continuous batching with vLLM
- **Speculative Decoding**: Draft model for faster generation

### API Optimization
- **Connection Pooling**: Reuse HTTP connections
- **Async Everything**: FastAPI with asyncio
- **Response Compression**: gzip for large payloads
- **Caching**: Redis for frequent queries

### Frontend Optimization
- **Code Splitting**: Lazy load routes
- **Virtual Scrolling**: For long chat histories
- **Debounced Input**: Prevent excessive API calls
- **Service Worker**: Offline support

---

## I) Scaling Roadmap

### Phase 1: Single Server (Current)
- 1x GPU server
- Docker Compose
- Local development ready

### Phase 2: Multi-Model (3-6 months)
- Add model router
- A/B testing infrastructure
- Model versioning

### Phase 3: Horizontal Scale (6-12 months)
- Kubernetes cluster
- Multiple GPU nodes
- Auto-scaling policies
- CDN for frontend

### Phase 4: Enterprise (12+ months)
- Multi-tenant isolation
- SSO integration
- Audit logging
- SLA monitoring
- Disaster recovery

---

## Model Recommendations

### Small (8GB VRAM)
- Llama 3.1 8B (AWQ quantized)
- Mistral 7B
- Qwen2 7B

### Medium (16-24GB VRAM)
- Llama 3.1 70B (4-bit)
- Mixtral 8x7B
- Command-R

### Large (48GB+ VRAM)
- Llama 3.1 70B (FP16)
- Qwen2 72B
- DeepSeek V2

---

Built with ❤️ by Nova AI Team
