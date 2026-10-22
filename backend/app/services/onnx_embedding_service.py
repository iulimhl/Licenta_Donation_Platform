from pathlib import Path

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer


class OnnxEmbeddingModel:
    def __init__(self, model_directory):
        directory = Path(model_directory)
        self.tokenizer = Tokenizer.from_file(str(directory / "tokenizer.json"))
        self.tokenizer.enable_truncation(max_length=128)
        self.tokenizer.enable_padding()
        options = ort.SessionOptions()
        options.intra_op_num_threads = 1
        options.inter_op_num_threads = 1
        options.enable_cpu_mem_arena = False
        self.session = ort.InferenceSession(
            str(directory / "model.onnx"), sess_options=options,
            providers=["CPUExecutionProvider"],
        )

    def encode(self, text, normalize_embeddings=True):
        tokens = self.tokenizer.encode(text)
        inputs = {
            "input_ids": np.array([tokens.ids], dtype=np.int64),
            "attention_mask": np.array([tokens.attention_mask], dtype=np.int64),
            "token_type_ids": np.array([tokens.type_ids], dtype=np.int64),
        }
        names = {item.name for item in self.session.get_inputs()}
        hidden_states = self.session.run(None, {key: value for key, value in inputs.items() if key in names})[0]
        mask = inputs["attention_mask"][..., None]
        embedding = (hidden_states * mask).sum(axis=1) / np.maximum(mask.sum(axis=1), 1)
        vector = embedding[0].astype(np.float32)
        if normalize_embeddings:
            vector /= max(float(np.linalg.norm(vector)), 1e-12)
        return vector
