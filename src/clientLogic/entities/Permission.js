class Permission {
  constructor(permission) {
    this.codeId = permission;
    [this.module, this.name] = permission.split('.');
  }

  toJson() {
    return this.codeId;
  }
}

export default Permission;
