package integration_test

import (
	"math"
	"testing"

	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/analysis"
	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/internal/testonly"
	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/modes"
)

func TestDistribution(t *testing.T) {
	d := analysis.Describe([]byte{0, 0, 255, 255})
	if d.Bytes != 4 || d.Histogram[0] != 2 || d.Histogram[255] != 2 || math.Abs(d.Entropy-1) > 1e-12 {
		t.Fatalf("wrong distribution: %+v", d)
	}
	if d := analysis.Describe(nil); d.Bytes != 0 || d.Entropy != 0 {
		t.Fatalf("empty distribution: %+v", d)
	}
}

func TestRunnerSeparatesBlockAndModeAvalanche(t *testing.T) {
	config := analysis.Config{
		Factory: testonly.Factory{}, Key: make([]byte, 16),
		BlockInput: make([]byte, 16), Input: make([]byte, 32),
		Modes: modes.All, Trials: 128, Seed: 42,
	}
	report, err := analysis.Run(config)
	if err != nil {
		t.Fatal(err)
	}
	if !report.Experimental || len(report.Modes) != 5 || report.BlockPlaintext.MeanChanged != 1 || report.BlockKey.MeanChanged != 1 {
		t.Fatalf("wrong report header / block avalanche: %+v", report)
	}
	for _, mode := range report.Modes {
		if !mode.RoundTrip || mode.Ciphertext.Bytes == 0 || mode.PlaintextAvalanche.Trials != 128 {
			t.Errorf("incomplete mode report: %+v", mode)
		}
		if (mode.Mode == modes.CTR || mode.Mode == modes.OFB) && mode.PlaintextAvalanche.MeanChanged != 1 {
			t.Errorf("%s should flip exactly one ciphertext bit", mode.Mode)
		}
	}
	if _, err := analysis.Run(analysis.Config{Factory: testonly.Factory{}, Key: make([]byte, 16), BlockInput: make([]byte, 15), Input: []byte{1}, Modes: modes.All, Trials: 1}); err == nil {
		t.Fatal("wrong block fixture size accepted")
	}
}
