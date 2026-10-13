.PHONY: all clean

all:
	latexmk -xelatex -interaction=nonstopmode -halt-on-error -outdir=.build main.tex
	cp .build/main.pdf draf-laporan.pdf

clean:
	rm -rf .build
	rm -f draf-laporan.pdf
