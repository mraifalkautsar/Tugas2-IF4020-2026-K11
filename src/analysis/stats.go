package analysis

import (
	"math"
	"math/bits"
)

type Distribution struct {
	Bytes     int         `json:"bytes"`
	Entropy   float64     `json:"entropy_bits_per_byte"`
	Histogram [256]uint64 `json:"histogram"`
}

func Describe(data []byte) Distribution {
	d := Distribution{Bytes: len(data)}
	for _, b := range data {
		d.Histogram[b]++
	}
	for _, count := range d.Histogram {
		if count != 0 {
			p := float64(count) / float64(len(data))
			d.Entropy -= p * math.Log2(p)
		}
	}
	return d
}

func changedBits(a, b []byte) int {
	count := 0
	for i := range a {
		count += bits.OnesCount8(a[i] ^ b[i])
	}
	return count
}

type Avalanche struct {
	Trials            int       `json:"trials"`
	OutputBits        int       `json:"output_bits"`
	MeanChanged       float64   `json:"mean_changed_bits"`
	MeanPercent       float64   `json:"mean_percent"`
	MinChanged        int       `json:"min_changed_bits"`
	MaxChanged        int       `json:"max_changed_bits"`
	PerInputBitMean   []float64 `json:"per_input_bit_mean,omitempty"`
	PerInputBitTrials []int     `json:"per_input_bit_trials,omitempty"`
}

type accumulator struct {
	Avalanche
	total  int
	sums   []int
	counts []int
}

func newAccumulator(outputBits, inputBits int) *accumulator {
	return &accumulator{
		Avalanche: Avalanche{OutputBits: outputBits, MinChanged: outputBits},
		sums:      make([]int, inputBits),
		counts:    make([]int, inputBits),
	}
}

func (a *accumulator) add(bit, changed int) {
	a.Trials++
	a.total += changed
	if len(a.sums) != 0 {
		a.sums[bit] += changed
		a.counts[bit]++
	}
	if changed < a.MinChanged {
		a.MinChanged = changed
	}
	if changed > a.MaxChanged {
		a.MaxChanged = changed
	}
}

func (a *accumulator) result() Avalanche {
	a.MeanChanged = float64(a.total) / float64(a.Trials)
	a.MeanPercent = a.MeanChanged * 100 / float64(a.OutputBits)
	if len(a.sums) != 0 {
		a.PerInputBitMean = make([]float64, len(a.sums))
		a.PerInputBitTrials = append([]int(nil), a.counts...)
		for i, count := range a.counts {
			if count != 0 {
				a.PerInputBitMean[i] = float64(a.sums[i]) / float64(count)
			}
		}
	}
	return a.Avalanche
}
