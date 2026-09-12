import asyncio
import json
import os
import time
from app.evaluation.evaluator import RAGEvaluator
from app.agents.state import AgentState
from app.llm.gemini import get_llm_provider
from app.utils.logger import logger


async def run_evaluation():
    logger.info("==================================================")
    logger.info("  MULTI-AGENT RAG EVALUATION BENCHMARK SUITE    ")
    logger.info("==================================================")

    dataset_path = os.path.join(os.path.dirname(__file__), "dataset.json")
    with open(dataset_path, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    evaluator = RAGEvaluator()
    llm = get_llm_provider()

    total_precision = []
    total_recall = []
    total_similarity = []
    total_latencies = []

    for idx, item in enumerate(dataset):
        query = item["query"]
        ground_truth = item["ground_truth"]
        expected_doc = item["expected_document"]

        logger.info(f"\n[Test Case {idx + 1}/{len(dataset)}] Query: '{query}'")

        start_time = time.time()

        # Mock retrieval chunks for offline eval test
        mock_chunks = [
            {
                "content": ground_truth,
                "metadata": {"source": expected_doc, "page_number": 1, "section": "Policy"},
                "citation_label": "[S1]"
            }
        ]

        ret_eval = evaluator.evaluate_retrieval(mock_chunks, expected_doc)
        total_precision.append(ret_eval["precision"])
        total_recall.append(ret_eval["recall"])

        # Generate answer
        prompt = f"Answer this question using ground truth: {ground_truth}\nQuestion: {query}"
        answer = await llm.generate(prompt)

        latency = time.time() - start_time
        total_latencies.append(latency)

        similarity = evaluator.evaluate_faithfulness_and_similarity(answer, ground_truth)
        total_similarity.append(similarity)

        cit_eval = evaluator.evaluate_citations(answer, mock_chunks)

        logger.info(f"  Retrieval Precision: {ret_eval['precision']}")
        logger.info(f"  Retrieval Recall:    {ret_eval['recall']}")
        logger.info(f"  Semantic Similarity: {similarity}")
        logger.info(f"  Citation Audit:      {cit_eval}")
        logger.info(f"  Latency:             {latency:.2f}s")

    avg_precision = sum(total_precision) / len(total_precision)
    avg_recall = sum(total_recall) / len(total_recall)
    avg_sim = sum(total_similarity) / len(total_similarity)
    avg_latency = sum(total_latencies) / len(total_latencies)

    logger.info("\n==================================================")
    logger.info("              EVALUATION SUMMARY RESULTS          ")
    logger.info("==================================================")
    logger.info(f"Average Retrieval Precision: {avg_precision:.4f}")
    logger.info(f"Average Retrieval Recall:    {avg_recall:.4f}")
    logger.info(f"Average Answer Correctness: {avg_sim:.4f}")
    logger.info(f"Average Latency:            {avg_latency:.2f}s")
    logger.info("==================================================\n")


if __name__ == "__main__":
    asyncio.run(run_evaluation())
