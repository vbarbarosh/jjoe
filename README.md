# jjoe

Track changes in objects.

Having an url returning a list of products, it could be
useful to track changes in these objects.

## How to start

    cat db/schema.sql | mysql -uroot -p123

## Example of usage:

    stream-foo | bin/run

## Example of an object stream:

    100
    {"uid":"foo","value":{"title":"Foo"}}
    {"uid":"bar","value":{"title":"Bar"}}
    {"uid":"baz","value":{"title":"Baz"}}

## How it works

`bin/run` takes from `stdout` a stream of JSON objects (first line should
contain expected number of objects or be empty), parses each object and updates
database.

Each object should consist of just two properties: `uid` and `value`. Objects
without these properties are considered malformed and will be discarded.
