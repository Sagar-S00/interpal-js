export type ModelData = Record<string, unknown>;

export class BaseModel<T extends ModelData = ModelData> {
  protected _data: T;

  constructor(data: T) {
    this._data = { ...data };
    Object.assign(this, data);
  }

  update(data: Partial<T>): void {
    Object.assign(this, data);
    Object.assign(this._data, data);
  }

  toJSON(): T {
    return { ...this._data };
  }
}

