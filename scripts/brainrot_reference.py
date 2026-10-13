#!/usr/bin/env python3
"""Independent flat-byte reference for frozen Brainrot test vectors.

Uses polynomial long division and derives the AES S-box algebraically rather
than importing Go tables or transformations. Python is only a development tool.
Without --write-vectors, verifies that the frozen fixture matches this reference.
"""

import argparse
import json
from itertools import combinations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / "src/cipher/brainrot/testdata/brainrot-vectors.json"
MATRIX = ((12, 10, 6, 6), (7, 14, 9, 7), (6, 6, 12, 10), (9, 7, 7, 14))
ROTATIONS = ((9, 21, 37), (13, 29, 43), (7, 17, 31), (11, 23, 41))


def multiply(a, b):
    product = 0
    for bit in range(8):
        if (b >> bit) & 1:
            product ^= a << bit
    for bit in range(14, 7, -1):
        if (product >> bit) & 1:
            product ^= 0x11B << (bit - 8)
    return product


def rotate(value, amount, width):
    return ((value << amount) | (value >> (width - amount))) & ((1 << width) - 1)


def aes_substitute(value):
    # x^254 is the multiplicative inverse for nonzero x, and maps zero to zero.
    inverse, power = 1, value
    exponent = 254
    while exponent:
        if exponent & 1:
            inverse = multiply(inverse, power)
        power = multiply(power, power)
        exponent >>= 1
    return inverse ^ rotate(inverse, 1, 8) ^ rotate(inverse, 2, 8) ^ \
        rotate(inverse, 3, 8) ^ rotate(inverse, 4, 8) ^ 0x63


SBOX = [rotate(aes_substitute(x ^ 0x67), 6, 8) ^ 0x43 for x in range(256)]


def expand(key):
    words = [list(key[i:i + 4]) for i in range(0, 16, 4)]
    rcon = 1
    for index in range(4, 84):
        temp = words[-1][:]
        if index % 4 == 0:
            temp = [SBOX[x] for x in temp[1:] + temp[:1]]
            temp[0] ^= rcon ^ 0x67
            rcon = multiply(rcon, 2)
        words.append([a ^ b for a, b in zip(words[index - 4], temp)])
    return [sum(words[index:index + 4], []) for index in range(0, 84, 4)]


def shift(data):
    return [data[4 * ((column - (6 + row) % 4) % 4) + row]
            for column in range(4) for row in range(4)]


def mix(data):
    result = []
    for column in range(4):
        for row in range(4):
            value = 0
            for index in range(4):
                value ^= multiply(MATRIX[row][index], data[4 * column + index])
            result.append(value)
    return result


def transpose(data):
    # Destination-based inverse mapping is independent of the Go scatter loop.
    result = [0] * 16
    for destination in range(128):
        original = 43 * destination % 128
        byte_index, bit = original % 16, original // 16
        result[destination // 8] |= ((data[byte_index] >> (7 - bit)) & 1) \
            << (7 - destination % 8)
    return result


def feistel(data):
    left = int.from_bytes(bytes(data[:8]), "big")
    right = int.from_bytes(bytes(data[8:]), "big")
    for a, b, c in ROTATIONS:
        function = rotate(right, a, 64) ^ (right & rotate(right, b, 64)) ^ \
            rotate(right, c, 64)
        left, right = right, left ^ function
    return list(left.to_bytes(8, "big") + right.to_bytes(8, "big"))


def vector(name, key, plaintext):
    keys = expand(key)
    snapshots = []
    data = [a ^ b ^ 0x43 for a, b in zip(plaintext, keys[0])]

    def record(round_number, operation):
        snapshots.append({"round": round_number, "operation": operation,
                          "state_hex": bytes(data).hex()})

    record(0, "AddRoundKey67")
    for round_number in range(1, 11):
        data = [SBOX[x] for x in data]
        record(round_number, "SubBytes67")
        data = shift(data)
        record(round_number, "ShiftRows67")
        data = mix(data)
        record(round_number, "MixColumns67")
        data = transpose(data)
        record(round_number, "BitPlaneTranspose")
        if round_number % 2 == 0:
            data = feistel(data)
            record(round_number, "FeistelCrossMix")
        data = [(a + b) % 256 for a, b in zip(data, keys[2 * round_number - 1])]
        record(round_number, "ModularAddition")
        data = [a ^ b ^ 0x43 for a, b in zip(data, keys[2 * round_number])]
        record(round_number, "AddRoundKey67")
    return {"name": name, "key_hex": key.hex(), "plaintext_hex": plaintext.hex(),
            "ciphertext_hex": bytes(data).hex(),
            "subkeys_hex": [bytes(k).hex() for k in keys], "snapshots": snapshots}


def check_diffusion():
    columns = []
    for bit in range(128):
        data = [0] * 16
        data[bit // 8] = 1 << (bit % 8)
        columns.append(int.from_bytes(bytes(transpose(mix(shift(data)))), "little"))
    transposed = [sum(((column >> row) & 1) << index
                      for index, column in enumerate(columns)) for row in range(128)]
    for name, matrix in [("differences", columns), ("linear masks", transposed)]:
        # Row elimination: a full-rank restriction excludes any nonzero input
        # supported on I whose output is supported on O.
        rows = [sum(((column >> row) & 1) << index
                    for index, column in enumerate(matrix)) for row in range(128)]
        checked = 0
        for input_size in range(1, 4):
            for output_size in range(1, 5 - input_size):
                for inputs in combinations(range(16), input_size):
                    input_mask = sum(255 << (8 * i) for i in inputs)
                    for outputs in combinations(range(16), output_size):
                        allowed, pivots = set(outputs), {}
                        for index, row in enumerate(rows):
                            if index // 8 in allowed:
                                continue
                            value = row & input_mask
                            while value:
                                pivot = value.bit_length() - 1
                                if pivot in pivots:
                                    value ^= pivots[pivot]
                                else:
                                    pivots[pivot] = value
                                    break
                            if len(pivots) == 8 * input_size:
                                break
                        assert len(pivots) == 8 * input_size, (name, inputs, outputs)
                        checked += 1
        assert checked == 36416
        print(f"Independent {name} check: all {checked} supports exclude byte branch number <5")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write-vectors", action="store_true")
    parser.add_argument("--check-diffusion", action="store_true")
    args = parser.parse_args()
    fixture = {
        "cipher": "Brainrot Cipher",
        "provenance": "scripts/brainrot_reference.py; algebraic S-box, polynomial GF multiplication",
        "vectors": [
            vector("zero", bytes(16), bytes(16)),
            vector("ones", bytes([255]) * 16, bytes([255]) * 16),
            vector("incrementing", bytes(range(16)), bytes(range(16))),
            vector("fixture", bytes.fromhex("00112233445566778899aabbccddeeff"),
                   (ROOT / "src/testdata/fixtures/one-block.txt").read_bytes()),
        ],
    }
    if args.write_vectors:
        DESTINATION.parent.mkdir(parents=True, exist_ok=True)
        DESTINATION.write_text(json.dumps(fixture, indent=2) + "\n")
        print(f"Wrote {DESTINATION}")
    else:
        assert json.loads(DESTINATION.read_text()) == fixture, "Frozen vectors differ"
        print("All four frozen vectors, 84 subkeys, and 264 snapshots match the reference")
    if args.check_diffusion:
        check_diffusion()


if __name__ == "__main__":
    main()
