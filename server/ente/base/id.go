package base

import (
	"errors"
	"fmt"
	"github.com/matoous/go-nanoid/v2"
)

// Ref https://github.com/ente-io/ente/blob/main/web/packages/base/id.ts#L4
const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

// NewID generates a new random identifier with the given prefix.
func NewID(prefix string) (*string, error) {
	if len(prefix) < 2 {
		return nil, errors.New("prefix must be at least 2 characters long")
	}
	// check that prefix only contains alphabet characters
	for _, c := range prefix {
		if !(c >= 'a' && c <= 'z') {
			return nil, errors.New("prefix must only contain lower case alphabet characters")
		}
	}
	// Generate a nanoid with a custom alphabet and length of 22
	id, err := gonanoid.Generate(alphabet, 22)
	if err != nil {
		return nil, err
	}
	result := fmt.Sprintf("%s_%s", prefix, id)
	return &result, nil
}
