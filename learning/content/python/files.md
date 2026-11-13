---
title: Files, streams and reliable cleanup
description: Read and write text or bytes, choose a file mode, understand stream position and use the full file-method reference.
course: Python
lesson: CHAPTER 10 OF 15
---

# Files, streams and reliable cleanup

A file object is a stream with operations such as reading, writing and moving a position. The file path identifies the resource; the open stream represents your current access to it. Use `with` to define the lifetime of that access explicitly.

## Paths, modes and encodings {#opening}

`open(path, mode, encoding=...)` opens a file. A relative path is interpreted from the current working directory, which may differ from the script's folder. `pathlib.Path` helps compose paths without hard-coding platform separators.

| Mode | Meaning |
| --- | --- |
| `r` | Read an existing file; missing file raises `FileNotFoundError` |
| `w` | Write a file, creating it or truncating its previous content |
| `x` | Create a new file exclusively; existing file raises `FileExistsError` |
| `a` | Append writes at the end, creating the file if necessary |
| `t` | Text mode; the default |
| `b` | Binary mode; read/write `bytes`, not text strings |
| `+` | Read and write; combine with a primary mode such as `r+` or `w+` |

Use an explicit encoding for text, for example UTF-8. ASCII, UTF-8 and Windows encodings such as `cp1252` describe different byte-to-text interpretations. Binary mode does not take an `encoding` argument. In these examples a temporary folder keeps practice files separate and is deleted at the end of each block.

## Writing text and closing the stream {#writing-and-closing}

```python
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as folder:
    path = Path(folder) / "lesson-notes.txt"
    with path.open("w", encoding="utf-8") as stream:
        written = stream.write("first line\n")
        stream.writelines(["second line\n", "third line\n"])
        assert written == len("first line\n")
        assert stream.writable()
    assert stream.closed
    assert path.read_text(encoding="utf-8") == "first line\nsecond line\nthird line\n"
```

`write` returns a character count for text and a byte count for binary data. `writelines` does **not** add separators: include newlines yourself. Closing flushes buffered output and releases the stream's resource; closing an already-closed stream is harmless.

The manual equivalent is `stream = open(...)`, then a `try` block and `stream.close()` in `finally`. Acquire the stream before that `try` so a failed open does not leave you trying to close an unassigned name. Prefer `with` when the resource supports it.

## Read, iterate, readline and readlines {#reading}

```python
with TemporaryDirectory() as folder:
    path = Path(folder) / "lines.txt"
    path.write_text("alpha\nbeta\ngamma\n", encoding="utf-8")
    with path.open(encoding="utf-8") as stream:
        assert stream.read(5) == "alpha"
        assert stream.read(1) == "\n"
        stream.seek(0)
        assert stream.readline() == "alpha\n"
        assert stream.readlines() == ["beta\n", "gamma\n"]
        assert stream.readline() == ""  # End of file, not a blank line.
        stream.seek(0)
        assert [line.rstrip("\n") for line in stream] == ["alpha", "beta", "gamma"]
```

`read()` with no size reads the remaining content into memory. Iteration processes lines incrementally. `readline()` reads one line; `readlines()` materializes a list of lines. A blank line is `"\n"`; end-of-file is `""` for a text read.

The optional `readlines(hint)` is a size **hint**, not a promise to return at most that many characters. It returns complete lines and can exceed the hint. `readline(size)` can return a partial line when a size bound is reached.

## Positions, chunks and binary data {#positions-and-chunks}

`tell()` gives a position token and `seek()` moves the stream. For text streams, treat the result of `tell()` as an opaque cookie, not an arbitrary character or byte index. Seeking to zero or back to a saved cookie is a useful supported pattern. Binary streams provide byte-oriented positions.

```python
with TemporaryDirectory() as folder:
    path = Path(folder) / "payload.bin"
    with path.open("w+b") as stream:
        assert stream.write(b"ABCDEF") == 6
        assert isinstance(stream.fileno(), int)
        assert not stream.isatty()
        assert stream.readable() and stream.writable() and stream.seekable()
        stream.flush()
        stream.truncate(4)
        stream.seek(0)
        chunks = list(iter(lambda: stream.read(2), b""))
        assert chunks == [b"AB", b"CD"]
```

The two-argument `iter(callable, sentinel)` keeps calling until a result equals the sentinel. Use `b""` for binary EOF and `""` for text EOF. Chunk processing avoids reading a whole large file at once. A file already acts as a line iterator, so use that directly for line-oriented work.

## File method reference {#method-reference}

Not every stream supports every operation: a pipe may not be seekable, and an in-memory stream may not have an operating-system file descriptor.

| Method | Purpose and a useful caveat |
| --- | --- |
| `close()` | Release the stream; inspect `.closed` afterwards |
| `detach()` | Separate a text wrapper from its underlying binary buffer; the wrapper then becomes unusable |
| `fileno()` | Obtain the operating-system file descriptor when one exists |
| `flush()` | Push buffered writes onward; this alone does not guarantee crash-safe disk persistence |
| `isatty()` | Ask whether the stream is connected to an interactive terminal |
| `read(size)` | Read up to a size in characters for text, bytes for binary; omitted/negative size reads the remainder |
| `readable()` | Report whether reading is supported |
| `readline(size)` | Read one line, optionally limited in size; may return a partial line |
| `readlines(hint)` | Collect lines, optionally using an approximate size hint |
| `seek(offset, whence)` | Reposition; `whence` is typically `os.SEEK_SET`, `SEEK_CUR` or `SEEK_END`, subject to text-stream restrictions |
| `seekable()` | Report whether positioning operations are supported |
| `tell()` | Obtain the current position/cookie |
| `truncate(size)` | Resize the underlying file; does not necessarily change the current position |
| `writable()` | Report whether writing is supported |
| `write(data)` | Write text or bytes matching the stream mode |
| `writelines(lines)` | Write an iterable of values without adding line endings |

```python
import io

text_stream = io.TextIOWrapper(io.BytesIO(b"ready\n"), encoding="utf-8")
raw_stream = text_stream.detach()
assert raw_stream.read() == b"ready\n"
raw_stream.close()
```

After `detach`, close the returned buffer yourself. Avoid detaching a stream and then expecting its original `with` block to close the now-invalid text wrapper normally.

## Try it yourself

Write a function that counts non-empty lines without loading the entire file. Test an empty file, a blank line and a final line with no newline terminator.

??? question "Why prefer with over waiting for an object to be garbage-collected?"
    `with` defines a deterministic cleanup point even when the body raises an exception. Garbage-collection timing is not a portable resource-management contract, and an open file can retain buffers or descriptors longer than intended.

[Next: Classes and inheritance →](classes.md){ .md-button .md-button--primary }
