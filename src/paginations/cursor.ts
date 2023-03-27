class Cursor {
    /**
     * Create a new cursor instance.
     */
    public constructor(
        protected cursorParameters: { [key: string]: string | number | bigint | null },
        protected cursorPointsToNextItems = true
    ) {}

    /**
     * Get the given parameter from the cursor.
     */
    public parameter(parameterName: string): string | number | bigint | null {
        if (!(parameterName in this.cursorParameters)) {
            throw new Error(`Unable to find parameter [${parameterName}] in pagination item.`);
        }

        return this.cursorParameters[parameterName];
    }

    /**
     * Get the given parameters from the cursor.
     */
    public parameters(parameterNames: string[]): (string | number | bigint | null)[] {
        return parameterNames.map(parameterName => {
            return this.parameter(parameterName);
        });
    }

    /**
     * Determine whether the cursor points to the next set of items.
     */
    public pointsToNextItems(): boolean {
        return this.cursorPointsToNextItems;
    }

    /**
     * Determine whether the cursor points to the previous set of items.
     */
    public pointsToPreviousItems(): boolean {
        return !this.cursorPointsToNextItems;
    }

    /**
     * Get the array representation of the cursor.
     */
    public toJSON(): any {
        return Object.assign({}, this.cursorParameters, {
            _pointsToNextItems: this.cursorPointsToNextItems
        });
    }

    /**
     * Get the encoded string representation of the cursor to construct a URL.
     */
    public encode(): string {
        return Buffer.from(JSON.stringify(this))
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/\=/g, '');
    }

    /**
     * Get a cursor instance from the encoded string representation.
     */
    public static fromEncoded(encodedString: string): Cursor | null {
        try {
            const parameters = JSON.parse(
                Buffer.from(encodedString.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('ascii')
            );
            const pointsToNextItems = parameters._pointsToNextItems;
            delete parameters._pointsToNextItems;
            return new Cursor(parameters, pointsToNextItems);
        } catch (error) {
            return null;
        }
    }
}

export default Cursor;
