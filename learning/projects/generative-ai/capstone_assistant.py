"""An original deterministic teaching prototype; all workshop records are fictional."""
from dataclasses import dataclass
from hashlib import sha256
import json
import re

@dataclass(frozen=True)
class Document:
    id: str
    text: str
    access: str = "public"
    revision: str = "teaching-v1"

CORPUS = (
    Document("python-1", "The fictional Python session covers functions and dictionaries."),
    Document("data-1", "The fictional data session covers tables and joins."),
    Document("schedule-1", "The fictional schedule places the Python session on Saturday."),
    Document("staff-1", "Private discount arrangements are limited to staff.", "staff"),
)
STOPWORDS = {"a", "an", "the", "which", "what", "does", "is", "are", "and", "of", "to", "for", "workshop", "session", "fictional"}

def terms(text):
    return set(re.findall(r"[a-z0-9]+", text.casefold())) - STOPWORDS

def permitted_documents(role):
    if role not in {"public", "staff"}:
        raise ValueError("Unsupported teaching role")
    return tuple(doc for doc in CORPUS if doc.access == "public" or role == "staff")

def retrieve(question, role="public", limit=2):
    if not isinstance(limit, int) or not 1 <= limit <= 5:
        raise ValueError("Invalid retrieval limit")
    candidates = permitted_documents(role)
    query = terms(question)
    ranked = sorted(((len(query & terms(doc.text)), doc) for doc in candidates), key=lambda item: (-item[0], item[1].id))
    return tuple(doc for score, doc in ranked[:limit] if score > 0)

def verify(response, evidence):
    if set(response) != {"status", "answer", "citations"}:
        return False
    if not isinstance(response["answer"], str) or not isinstance(response["citations"], list):
        return False
    by_id = {doc.id: doc for doc in evidence}
    if response["status"] == "needs_information":
        return response["citations"] == []
    if response["status"] != "answered" or not response["citations"]:
        return False
    if any(not isinstance(identifier, str) or identifier not in by_id for identifier in response["citations"]):
        return False
    expected = " ".join(by_id[identifier].text for identifier in response["citations"])
    return response["answer"] == expected

def run(question, role="public", budget=3):
    if not isinstance(question, str) or not question.strip() or len(question) > 2000 or role not in {"public", "staff"}:
        return {"status": "invalid_input", "answer": "Provide a question and a supported teaching role.", "citations": [], "trace": []}
    if not isinstance(budget, int) or budget < 3:
        return {"status": "budget_exhausted", "answer": "The configured budget is insufficient.", "citations": [], "trace": []}
    identity = sha256(json.dumps([question, role, "teaching-v1"]).encode()).hexdigest()[:16]
    evidence = retrieve(question, role)
    trace = [{"stage": "retrieve", "source_ids": [doc.id for doc in evidence]}]
    response = {"status": "answered", "answer": " ".join(doc.text for doc in evidence), "citations": [doc.id for doc in evidence]} if evidence else {
        "status": "needs_information", "answer": "The teaching collection has no matching evidence.", "citations": []}
    trace.append({"stage": "respond", "kind": "extractive"})
    accepted = verify(response, evidence)
    trace.append({"stage": "verify", "accepted": accepted})
    if not accepted:
        response = {"status": "verification_failed", "answer": "The response did not meet the teaching contract.", "citations": []}
    return {**response, "request_id": identity, "corpus_revision": "teaching-v1", "trace": trace}

if __name__ == "__main__":
    print(json.dumps(run("Python functions"), indent=2))
